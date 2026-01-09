import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Alert, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { MediaStream } from 'react-native-webrtc';
import { WebRTCService, CallType } from '@/lib/webrtc';
import {
    CallSignal,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    addIceCandidateToCall,
    subscribeToCallEvents,
    markCallAsMissed,
} from '@/lib/callSignaling';
import { useAuth } from './AuthContext';
import { playCallingSound, stopAllCallSounds, playRingtone, initializeAudioMode } from '@/lib/callSound';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface CallContextType {
    // State
    callState: CallState;
    currentCall: CallSignal | null;
    incomingCall: CallSignal | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isMuted: boolean;
    isVideoOff: boolean;
    callDuration: number;

    // Actions
    startCall: (conversationId: string, calleeId: string, callType: CallType) => Promise<void>;
    answerCall: () => Promise<void>;
    declineCall: () => Promise<void>;
    hangUp: () => Promise<void>;
    toggleMute: () => void;
    toggleVideo: () => void;
    switchCamera: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const CALL_TIMEOUT = 30000; // 30 seconds

export function CallProvider({ children }: { children: React.ReactNode }) {
    const { session } = useAuth();
    const router = useRouter();

    // State
    const [callState, setCallState] = useState<CallState>('idle');
    const [currentCall, setCurrentCall] = useState<CallSignal | null>(null);
    const [incomingCall, setIncomingCall] = useState<CallSignal | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    // Refs
    const webrtcService = useRef<WebRTCService | null>(null);
    const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Refs to track current values for callbacks (avoid stale closures)
    const currentCallRef = useRef<CallSignal | null>(null);
    const incomingCallRef = useRef<CallSignal | null>(null);

    // Keep refs in sync with state
    useEffect(() => {
        currentCallRef.current = currentCall;
    }, [currentCall]);

    useEffect(() => {
        incomingCallRef.current = incomingCall;
    }, [incomingCall]);

    // Cleanup function
    const cleanup = useCallback(() => {
        // Stop all call sounds
        stopAllCallSounds();

        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
        if (webrtcService.current) {
            webrtcService.current.cleanup();
            webrtcService.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIsMuted(false);
        setIsVideoOff(false);
        setCallDuration(0);
        setCallState('idle');
        setCurrentCall(null);
    }, []);

    // Subscribe to call events
    useEffect(() => {
        if (!session?.user?.id) return;

        const unsubscribe = subscribeToCallEvents(session.user.id, {
            onIncomingCall: (call) => {
                console.log('[CallContext] Incoming call:', call);
                setIncomingCall(call);
                Vibration.vibrate([0, 500, 200, 500], true);
                playRingtone(); // Play ringtone for incoming call

                // Auto-miss after timeout if not answered
                callTimeoutRef.current = setTimeout(() => {
                    // Use ref to get current value
                    if (incomingCallRef.current?.id === call.id) {
                        markCallAsMissed(call.id);
                        setIncomingCall(null);
                        Vibration.cancel();
                    }
                }, CALL_TIMEOUT);
            },

            onCallAccepted: async (call) => {
                console.log('[CallContext] Call accepted:', call);

                // Stop calling sound when call is answered
                stopAllCallSounds();

                // Clear the "no answer" timeout since call was accepted
                if (callTimeoutRef.current) {
                    clearTimeout(callTimeoutRef.current);
                    callTimeoutRef.current = null;
                }

                setCallState('connected');

                // Start timer for caller (callee starts in answerCall)
                // Use ref to get current call value (avoid stale closure)
                const currentCallId = currentCallRef.current?.id;
                console.log('[CallContext] Current call ID:', currentCallId, 'Received call ID:', call.id);

                if (currentCallId === call.id && !durationIntervalRef.current) {
                    console.log('[CallContext] Starting timer for caller');
                    durationIntervalRef.current = setInterval(() => {
                        setCallDuration((prev) => prev + 1);
                    }, 1000);
                }
            },

            onCallRejected: (call) => {
                console.log('[CallContext] Call rejected:', call);
                Alert.alert('Call Rejected', 'The other user declined your call.');
                cleanup();
            },

            onCallEnded: (call) => {
                console.log('[CallContext] Call ended:', call);
                cleanup();
                setIncomingCall(null);
                Vibration.cancel();
            },

            onAnswerReceived: async (callId, answerJson) => {
                console.log('[CallContext] Answer received');
                if (webrtcService.current) {
                    try {
                        const answer = JSON.parse(answerJson);
                        await webrtcService.current.handleRemoteAnswer(answer);
                    } catch (error) {
                        console.error('[CallContext] Failed to handle answer:', error);
                    }
                }
            },

            onIceCandidateReceived: async (callId, candidate) => {
                console.log('[CallContext] ICE candidate received');
                if (webrtcService.current) {
                    try {
                        await webrtcService.current.addIceCandidate(candidate);
                    } catch (error) {
                        console.error('[CallContext] Failed to add ICE candidate:', error);
                    }
                }
            },
        });

        return () => {
            unsubscribe();
            cleanup();
        };
    }, [session?.user?.id, cleanup]);

    // Start an outgoing call
    const startCall = useCallback(async (
        conversationId: string,
        calleeId: string,
        callType: CallType
    ) => {
        if (!session?.user?.id) {
            Alert.alert('Error', 'You must be logged in to make calls.');
            return;
        }

        // Buffer for candidates generated before the call ID exists
        let createdCallId: string | null = null;
        const pendingCandidates: any[] = [];

        try {
            setCallState('calling');

            // Navigate to call screen IMMEDIATELY (before WebRTC setup)
            // Use conversationId for immediate navigation
            router.push(`/call/${conversationId}`);

            // Initialize audio mode and play calling sound
            await initializeAudioMode();
            playCallingSound();

            // Initialize WebRTC
            webrtcService.current = new WebRTCService({
                onLocalStream: setLocalStream,
                onRemoteStream: (stream) => {
                    console.log('[CallContext] Remote stream received in caller');
                    setRemoteStream(stream);
                },
                onIceCandidate: async (candidate) => {
                    // Use createdCallId (local var) or currentCallRef (for later candidates)
                    const callId = createdCallId || currentCallRef.current?.id;

                    if (callId) {
                        console.log('[CallContext] Sending caller ICE candidate for call:', callId);
                        await addIceCandidateToCall(callId, candidate);
                    } else {
                        // Buffer the candidate instead of dropping it
                        console.log('[CallContext] Buffering ICE candidate (waiting for call ID)');
                        pendingCandidates.push(candidate);
                    }
                },
                onConnectionStateChange: (state) => {
                    console.log('[CallContext] Connection state:', state);
                    if (state === 'failed' || state === 'disconnected') {
                        Alert.alert('Call Failed', 'Connection lost.');
                        cleanup();
                    }
                },
                onError: (error) => {
                    console.error('[CallContext] WebRTC error:', error);
                    Alert.alert('Error', error.message);
                    cleanup();
                },
            });

            await webrtcService.current.initialize(callType);
            const offer = await webrtcService.current.createOffer();

            // Send call signal via Supabase
            const call = await initiateCall(
                conversationId,
                session.user.id,
                calleeId,
                callType,
                offer
            );

            if (!call) {
                throw new Error('Failed to initiate call');
            }

            // Assign the ID and flush the buffer
            createdCallId = call.id;
            setCurrentCall(call);

            // Flush any pending ICE candidates
            if (pendingCandidates.length > 0) {
                console.log(`[CallContext] Flushing ${pendingCandidates.length} buffered ICE candidates`);
                for (const candidate of pendingCandidates) {
                    await addIceCandidateToCall(createdCallId, candidate);
                }
            }

            // Timeout if not answered
            callTimeoutRef.current = setTimeout(async () => {
                if (callState === 'calling') {
                    await markCallAsMissed(call.id);
                    Alert.alert('No Answer', 'The other user did not answer.');
                    cleanup();
                    router.back();
                }
            }, CALL_TIMEOUT);

        } catch (error: any) {
            console.error('[CallContext] Start call error:', error);
            Alert.alert('Call Failed', error.message || 'Failed to start call');
            cleanup();
        }
    }, [session?.user?.id, callState, currentCall, cleanup, router]);

    // Answer incoming call
    const answerCall = useCallback(async () => {
        if (!incomingCall || !session?.user?.id) return;

        // Capture call details before clearing incomingCall
        const callId = incomingCall.id;
        const callType = incomingCall.call_type;
        const sdpOffer = incomingCall.sdp_offer;
        const existingIceCandidates = incomingCall.ice_candidates;

        try {
            Vibration.cancel();
            if (callTimeoutRef.current) {
                clearTimeout(callTimeoutRef.current);
            }

            setCallState('connected');
            setCurrentCall(incomingCall);
            setIncomingCall(null);

            // Initialize WebRTC - use captured callId to avoid stale closure
            webrtcService.current = new WebRTCService({
                onLocalStream: setLocalStream,
                onRemoteStream: (stream) => {
                    console.log('[CallContext] Remote stream received in callee');
                    setRemoteStream(stream);
                },
                onIceCandidate: async (candidate) => {
                    // Use captured callId instead of incomingCall?.id
                    console.log('[CallContext] Sending ICE candidate for call:', callId);
                    await addIceCandidateToCall(callId, candidate);
                },
                onConnectionStateChange: (state) => {
                    console.log('[CallContext] Connection state:', state);
                    if (state === 'failed' || state === 'disconnected') {
                        Alert.alert('Call Failed', 'Connection lost.');
                        cleanup();
                    }
                },
                onError: (error) => {
                    console.error('[CallContext] WebRTC error:', error);
                    Alert.alert('Error', error.message);
                    cleanup();
                },
            });

            await webrtcService.current.initialize(callType);

            // Handle the offer and create answer
            const offer = JSON.parse(sdpOffer!);
            const answer = await webrtcService.current.handleRemoteOffer(offer);

            // Process any existing ICE candidates from the caller
            if (existingIceCandidates && existingIceCandidates.length > 0) {
                console.log('[CallContext] Processing existing ICE candidates:', existingIceCandidates.length);
                for (const candidate of existingIceCandidates) {
                    try {
                        await webrtcService.current.addIceCandidate(candidate);
                    } catch (error) {
                        console.error('[CallContext] Failed to add existing ICE candidate:', error);
                    }
                }
            }

            // Send answer via Supabase
            await acceptCall(callId, answer);

            // Navigate to call screen
            router.push(`/call/${callId}`);

            // Start duration timer (only if not already started)
            if (!durationIntervalRef.current) {
                durationIntervalRef.current = setInterval(() => {
                    setCallDuration((prev) => prev + 1);
                }, 1000);
            }

        } catch (error: any) {
            console.error('[CallContext] Answer call error:', error);
            Alert.alert('Error', error.message || 'Failed to answer call');
            cleanup();
        }
    }, [incomingCall, session?.user?.id, cleanup, router]);

    // Decline incoming call
    const declineCall = useCallback(async () => {
        if (!incomingCall) return;

        Vibration.cancel();
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
        }

        await rejectCall(incomingCall.id);
        setIncomingCall(null);
    }, [incomingCall]);

    // Hang up current call
    const hangUp = useCallback(async () => {
        if (currentCall) {
            await endCall(currentCall.id);
        }
        cleanup();
        router.back();
    }, [currentCall, cleanup, router]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (webrtcService.current) {
            const muted = webrtcService.current.toggleMute();
            setIsMuted(muted);
        }
    }, []);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (webrtcService.current) {
            const videoOff = webrtcService.current.toggleVideo();
            setIsVideoOff(videoOff);
        }
    }, []);

    // Switch camera
    const switchCamera = useCallback(() => {
        if (webrtcService.current) {
            webrtcService.current.switchCamera();
        }
    }, []);

    return (
        <CallContext.Provider
            value={{
                callState,
                currentCall,
                incomingCall,
                localStream,
                remoteStream,
                isMuted,
                isVideoOff,
                callDuration,
                startCall,
                answerCall,
                declineCall,
                hangUp,
                toggleMute,
                toggleVideo,
                switchCamera,
            }}
        >
            {children}
        </CallContext.Provider>
    );
}

export function useCall() {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
}
