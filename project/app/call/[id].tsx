import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Video,
    VideoOff,
    RotateCcw,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Only import WebRTC components on native platforms
let RTCView: any = null;
let useCall: any = null;

if (Platform.OS !== 'web') {
    RTCView = require('react-native-webrtc').RTCView;
    useCall = require('@/contexts/CallContext').useCall;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Remove duplicate VideoOff if present in imports above by resolving this block correctly
export default function CallScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    // On web, show a fallback message
    if (Platform.OS === 'web' || !useCall) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.audioPlaceholder}>
                    <Text style={styles.callerName}>CALL NOT AVAILABLE</Text>
                    <Text style={styles.statusText}>
                        Video/audio calls are only available on mobile devices
                    </Text>
                    <TouchableOpacity
                        style={styles.hangUpButton}
                        onPress={() => router.back()}
                    >
                        <PhoneOff size={28} color="#F5F5F5" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const {
        callState,
        currentCall,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        callDuration,
        hangUp,
        toggleMute,
        toggleVideo,
        switchCamera,
    } = useCall();

    const isVideoCall = currentCall?.call_type === 'video';
    const isConnected = callState === 'connected';

    return (
        <SafeAreaView style={styles.container}>
            {/* Remote Video (full screen) */}
            {isVideoCall && remoteStream && RTCView && (
                <RTCView
                    streamURL={remoteStream.toURL()}
                    style={styles.remoteVideo}
                    objectFit="cover"
                    mirror={false}
                />
            )}

            {/* Audio-only or no remote video - show placeholder */}
            {(!isVideoCall || !remoteStream) && (
                <View style={styles.audioPlaceholder}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarText}>
                            {currentCall?.callee_id?.slice(0, 2).toUpperCase() || '?'}
                        </Text>
                    </View>
                    <Text style={styles.callerName}>
                        {isConnected ? 'CONNECTED' : 'CALLING...'}
                    </Text>
                    {isConnected && (
                        <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
                    )}
                </View>
            )}

            {/* Local Video (picture-in-picture) */}
            {isVideoCall && localStream && !isVideoOff && RTCView && (
                <View style={styles.localVideoContainer}>
                    <RTCView
                        streamURL={localStream.toURL()}
                        style={styles.localVideo}
                        objectFit="cover"
                        mirror={true}
                    />
                </View>
            )}

            {/* Call status overlay */}
            <View style={styles.statusOverlay}>
                {!isConnected && (
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                            {callState === 'calling' ? 'CALLING...' : 'CONNECTING...'}
                        </Text>
                    </View>
                )}
                {isConnected && isVideoCall && (
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationOverlay}>
                            {formatDuration(callDuration)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <View style={styles.controls}>
                    {/* Mute */}
                    <TouchableOpacity
                        style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                        onPress={toggleMute}
                    >
                        {isMuted ? (
                            <MicOff size={24} color="#F5F5F5" />
                        ) : (
                            <Mic size={24} color="#F5F5F5" />
                        )}
                    </TouchableOpacity>

                    {/* Video toggle (only for video calls) */}
                    {isVideoCall && (
                        <TouchableOpacity
                            style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
                            onPress={toggleVideo}
                        >
                            {isVideoOff ? (
                                <VideoOff size={24} color="#F5F5F5" />
                            ) : (
                                <Video size={24} color="#F5F5F5" />
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Switch camera (only for video calls) */}
                    {isVideoCall && (
                        <TouchableOpacity
                            style={styles.controlButton}
                            onPress={switchCamera}
                        >
                            <RotateCcw size={24} color="#F5F5F5" />
                        </TouchableOpacity>
                    )}

                    {/* Hang up */}
                    <TouchableOpacity
                        style={styles.hangUpButton}
                        onPress={hangUp}
                    >
                        <PhoneOff size={28} color="#F5F5F5" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C1C1E',
    },
    safeArea: {
        flex: 1,
    },
    remoteVideo: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width,
        height,
    },
    audioPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2C2C2E',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#4A7C59',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#4A7C59',
    },
    callerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F5F5F5',
        marginBottom: 8,
        letterSpacing: 3,
    },
    duration: {
        fontSize: 16,
        color: '#8E8E93',
        fontWeight: '500',
    },
    localVideoContainer: {
        position: 'absolute',
        top: 60,
        right: 16,
        width: 90,
        height: 130,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#4A7C59',
        backgroundColor: '#000',
    },
    localVideo: {
        flex: 1,
    },
    statusOverlay: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    statusBadge: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3A3A3C',
    },
    durationBadge: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3A3A3C',
    },
    statusText: {
        color: '#F5F5F5',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 2,
    },
    durationOverlay: {
        color: '#F5F5F5',
        fontSize: 14,
        fontWeight: '600',
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3A3A3C',
    },
    controlButton: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: '#3A3A3C',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4A7C59',
    },
    controlButtonActive: {
        backgroundColor: '#FF453A',
        borderColor: '#FF453A',
    },
    hangUpButton: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#FF453A',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});
