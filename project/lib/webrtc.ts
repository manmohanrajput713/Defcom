import {
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceCandidate,
    mediaDevices,
    MediaStream,
} from 'react-native-webrtc';

// ICE server configuration - STUN + TURN servers for NAT traversal
// TURN servers are essential when devices are behind symmetric NAT (common on mobile)
const ICE_SERVERS = {
    iceServers: [
        // Google STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Free TURN servers from OpenRelay (for development/testing)
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
    iceCandidatePoolSize: 10,
};

export type CallType = 'audio' | 'video';

export interface WebRTCCallbacks {
    onLocalStream?: (stream: MediaStream) => void;
    onRemoteStream?: (stream: MediaStream) => void;
    onIceCandidate?: (candidate: RTCIceCandidate) => void;
    onConnectionStateChange?: (state: string) => void;
    onError?: (error: Error) => void;
}

export class WebRTCService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private callbacks: WebRTCCallbacks = {};

    // Queue for ICE candidates that arrive before remote description is set
    private pendingIceCandidates: RTCIceCandidate[] = [];
    private hasRemoteDescription: boolean = false;

    constructor(callbacks: WebRTCCallbacks = {}) {
        this.callbacks = callbacks;
    }

    /**
     * Initialize media devices and create peer connection
     */
    async initialize(callType: CallType): Promise<MediaStream> {
        try {
            // Reset state
            this.pendingIceCandidates = [];
            this.hasRemoteDescription = false;

            // Get local media stream
            const constraints = {
                audio: true,
                video: callType === 'video' ? {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                } : false,
            };

            this.localStream = await mediaDevices.getUserMedia(constraints);
            this.callbacks.onLocalStream?.(this.localStream);

            // Create peer connection
            this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

            // Add local tracks to peer connection
            this.localStream.getTracks().forEach((track) => {
                if (this.peerConnection && this.localStream) {
                    this.peerConnection.addTrack(track, this.localStream);
                }
            });

            // Handle incoming tracks (remote stream)
            this.peerConnection.ontrack = (event) => {
                console.log('[WebRTC] Remote track received:', event.track.kind, 'enabled:', event.track.enabled);
                console.log('[WebRTC] Streams count:', event.streams?.length || 0);

                if (event.streams && event.streams[0]) {
                    // If we already have a remote stream, check if this is the same one
                    if (this.remoteStream) {
                        console.log('[WebRTC] Adding track to existing remote stream');
                        // The stream is automatically updated, just notify again
                    } else {
                        console.log('[WebRTC] Setting new remote stream');
                        this.remoteStream = event.streams[0];
                    }

                    // Always notify when we get a track - the stream now has audio/video
                    const audioTracks = this.remoteStream.getAudioTracks();
                    const videoTracks = this.remoteStream.getVideoTracks();
                    console.log('[WebRTC] Remote stream now has:', audioTracks.length, 'audio tracks,', videoTracks.length, 'video tracks');

                    this.callbacks.onRemoteStream?.(this.remoteStream);
                } else {
                    console.warn('[WebRTC] Track received but no stream associated');
                }
            };

            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('[WebRTC] Local ICE candidate generated:', event.candidate.candidate?.substring(0, 50) + '...');
                    this.callbacks.onIceCandidate?.(event.candidate);
                } else {
                    console.log('[WebRTC] ICE gathering complete (null candidate received)');
                }
            };

            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                const state = this.peerConnection?.connectionState || 'unknown';
                console.log('[WebRTC] Connection state:', state);
                this.callbacks.onConnectionStateChange?.(state);

                if (state === 'failed' || state === 'disconnected') {
                    this.callbacks.onError?.(new Error(`Connection ${state}`));
                }
            };

            // Handle ICE connection state (more granular)
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('[WebRTC] ICE connection state:', this.peerConnection?.iceConnectionState);
            };

            return this.localStream;
        } catch (error) {
            this.callbacks.onError?.(error as Error);
            throw error;
        }
    }

    /**
     * Create an offer (for the caller)
     */
    async createOffer(): Promise<RTCSessionDescription> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        const offer = await this.peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        });

        await this.peerConnection.setLocalDescription(offer);
        return offer as RTCSessionDescription;
    }

    /**
     * Handle incoming offer and create answer (for the callee)
     */
    async handleRemoteOffer(offer: RTCSessionDescription): Promise<RTCSessionDescription> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        this.hasRemoteDescription = true;

        // Drain any pending ICE candidates
        await this.drainPendingCandidates();

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        return answer as RTCSessionDescription;
    }

    /**
     * Handle incoming answer (for the caller)
     */
    async handleRemoteAnswer(answer: RTCSessionDescription): Promise<void> {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        this.hasRemoteDescription = true;

        // Drain any pending ICE candidates
        await this.drainPendingCandidates();
    }

    /**
     * Add ICE candidate from remote peer
     * Queues if remote description not set yet
     */
    async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
        if (!this.peerConnection) {
            console.warn('[WebRTC] Peer connection not initialized, ignoring ICE candidate');
            return;
        }

        if (!this.hasRemoteDescription) {
            // Queue the candidate for later
            console.log('[WebRTC] Queueing ICE candidate (remote description not set yet)');
            this.pendingIceCandidates.push(candidate);
            return;
        }

        try {
            console.log('[WebRTC] Adding ICE candidate');
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('[WebRTC] Failed to add ICE candidate:', error);
        }
    }

    /**
     * Drain pending ICE candidates after remote description is set
     */
    private async drainPendingCandidates(): Promise<void> {
        if (this.pendingIceCandidates.length === 0) return;

        console.log(`[WebRTC] Draining ${this.pendingIceCandidates.length} pending ICE candidates`);

        for (const candidate of this.pendingIceCandidates) {
            try {
                await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error('[WebRTC] Failed to add queued ICE candidate:', error);
            }
        }

        this.pendingIceCandidates = [];
    }

    /**
     * Toggle local audio mute
     */
    toggleMute(): boolean {
        if (!this.localStream) return false;

        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            return !audioTrack.enabled; // Return true if muted
        }
        return false;
    }

    /**
     * Toggle local video
     */
    toggleVideo(): boolean {
        if (!this.localStream) return false;

        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            return !videoTrack.enabled; // Return true if video off
        }
        return false;
    }

    /**
     * Switch camera (front/back)
     */
    async switchCamera(): Promise<void> {
        if (!this.localStream) return;

        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack && typeof (videoTrack as any)._switchCamera === 'function') {
            (videoTrack as any)._switchCamera();
        }
    }

    /**
     * Get current streams
     */
    getStreams() {
        return {
            local: this.localStream,
            remote: this.remoteStream,
        };
    }

    /**
     * Clean up and close connection
     */
    cleanup(): void {
        // Clear pending candidates
        this.pendingIceCandidates = [];
        this.hasRemoteDescription = false;

        // Stop local tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
            this.localStream = null;
        }

        // Stop remote tracks
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach((track) => track.stop());
            this.remoteStream = null;
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
    }
}

