// Type declarations for react-native-webrtc
// The package includes types but some may be incomplete

declare module 'react-native-webrtc' {
    export class RTCPeerConnection {
        constructor(configuration?: RTCConfiguration);

        createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
        createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>;
        setLocalDescription(description: RTCSessionDescriptionInit): Promise<void>;
        setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
        addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
        addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender;
        close(): void;

        readonly connectionState: RTCPeerConnectionState;
        readonly iceConnectionState: RTCIceConnectionState;
        readonly signalingState: RTCSignalingState;

        onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null;
        ontrack: ((event: RTCTrackEvent) => void) | null;
        onconnectionstatechange: (() => void) | null;
        oniceconnectionstatechange: (() => void) | null;
    }

    export class RTCSessionDescription {
        constructor(descriptionInitDict?: RTCSessionDescriptionInit);
        readonly type: RTCSdpType;
        readonly sdp: string;
    }

    export class RTCIceCandidate {
        constructor(candidateInitDict?: RTCIceCandidateInit);
        readonly candidate: string;
        readonly sdpMid: string | null;
        readonly sdpMLineIndex: number | null;
    }

    export class MediaStream {
        constructor(tracks?: MediaStreamTrack[]);
        readonly id: string;
        getTracks(): MediaStreamTrack[];
        getAudioTracks(): MediaStreamTrack[];
        getVideoTracks(): MediaStreamTrack[];
        addTrack(track: MediaStreamTrack): void;
        removeTrack(track: MediaStreamTrack): void;
        toURL(): string;
    }

    export interface MediaStreamTrack {
        readonly id: string;
        readonly kind: 'audio' | 'video';
        enabled: boolean;
        stop(): void;
        _switchCamera?: () => void;
    }

    export const mediaDevices: {
        getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
        enumerateDevices(): Promise<MediaDeviceInfo[]>;
    };

    export interface RTCView extends React.Component<RTCViewProps> { }

    export interface RTCViewProps {
        streamURL: string;
        style?: any;
        objectFit?: 'contain' | 'cover';
        mirror?: boolean;
        zOrder?: number;
    }

    export const RTCView: React.ComponentType<RTCViewProps>;

    // Standard WebRTC types
    interface RTCConfiguration {
        iceServers?: RTCIceServer[];
        iceTransportPolicy?: RTCIceTransportPolicy;
        bundlePolicy?: RTCBundlePolicy;
        rtcpMuxPolicy?: RTCRtcpMuxPolicy;
    }

    interface RTCIceServer {
        urls: string | string[];
        username?: string;
        credential?: string;
    }

    interface RTCOfferOptions {
        offerToReceiveAudio?: boolean;
        offerToReceiveVideo?: boolean;
        iceRestart?: boolean;
    }

    interface RTCAnswerOptions {
        // Empty for now
    }

    interface RTCSessionDescriptionInit {
        type: RTCSdpType;
        sdp?: string;
    }

    interface RTCIceCandidateInit {
        candidate?: string;
        sdpMid?: string | null;
        sdpMLineIndex?: number | null;
    }

    interface RTCPeerConnectionIceEvent {
        candidate: RTCIceCandidate | null;
    }

    interface RTCTrackEvent {
        track: MediaStreamTrack;
        streams: MediaStream[];
    }

    interface RTCRtpSender {
        track: MediaStreamTrack | null;
        replaceTrack(track: MediaStreamTrack | null): Promise<void>;
    }

    interface MediaStreamConstraints {
        audio?: boolean | MediaTrackConstraints;
        video?: boolean | MediaTrackConstraints;
    }

    interface MediaTrackConstraints {
        facingMode?: string | ConstrainDOMString;
        width?: number | ConstrainULong;
        height?: number | ConstrainULong;
        frameRate?: number | ConstrainDouble;
    }

    interface ConstrainDOMString {
        exact?: string;
        ideal?: string;
    }

    interface ConstrainULong {
        exact?: number;
        ideal?: number;
        min?: number;
        max?: number;
    }

    interface ConstrainDouble {
        exact?: number;
        ideal?: number;
        min?: number;
        max?: number;
    }

    interface MediaDeviceInfo {
        deviceId: string;
        groupId: string;
        kind: 'audioinput' | 'audiooutput' | 'videoinput';
        label: string;
    }

    type RTCSdpType = 'offer' | 'pranswer' | 'answer' | 'rollback';
    type RTCPeerConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
    type RTCIceConnectionState = 'new' | 'checking' | 'connected' | 'completed' | 'disconnected' | 'failed' | 'closed';
    type RTCSignalingState = 'stable' | 'have-local-offer' | 'have-remote-offer' | 'have-local-pranswer' | 'have-remote-pranswer' | 'closed';
    type RTCIceTransportPolicy = 'all' | 'relay';
    type RTCBundlePolicy = 'balanced' | 'max-bundle' | 'max-compat';
    type RTCRtcpMuxPolicy = 'require';
}
