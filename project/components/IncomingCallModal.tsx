import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
} from 'react-native';
import { Phone, PhoneOff, Video } from 'lucide-react-native';
import { useCall } from '@/contexts/CallContext';

const { width } = Dimensions.get('window');

export default function IncomingCallModal() {
    const { incomingCall, answerCall, declineCall } = useCall();

    if (!incomingCall) return null;

    const isVideoCall = incomingCall.call_type === 'video';

    return (
        <Modal
            visible={!!incomingCall}
            transparent
            animationType="slide"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Call type indicator */}
                    <View style={styles.callTypeContainer}>
                        {isVideoCall ? (
                            <Video size={24} color="#fff" />
                        ) : (
                            <Phone size={24} color="#fff" />
                        )}
                        <Text style={styles.callTypeText}>
                            Incoming {isVideoCall ? 'Video' : 'Audio'} Call
                        </Text>
                    </View>

                    {/* Caller avatar */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {incomingCall.caller_id?.slice(0, 2).toUpperCase() || '?'}
                            </Text>
                        </View>
                        <View style={styles.pulseRing} />
                    </View>

                    {/* Caller info */}
                    <Text style={styles.callerName}>Incoming Call</Text>
                    <Text style={styles.callerSubtext}>
                        {isVideoCall ? 'Video call' : 'Audio call'}
                    </Text>

                    {/* Action buttons */}
                    <View style={styles.actions}>
                        {/* Decline */}
                        <TouchableOpacity
                            style={[styles.actionButton, styles.declineButton]}
                            onPress={declineCall}
                        >
                            <PhoneOff size={32} color="#fff" />
                        </TouchableOpacity>

                        {/* Accept */}
                        <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={answerCall}
                        >
                            {isVideoCall ? (
                                <Video size={32} color="#fff" />
                            ) : (
                                <Phone size={32} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Labels */}
                    <View style={styles.labels}>
                        <Text style={styles.label}>Decline</Text>
                        <Text style={styles.label}>Accept</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width - 40,
        backgroundColor: '#1a1a2e',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
    },
    callTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    callTypeText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 16,
        marginLeft: 10,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 24,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#4a4a6a',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
    },
    pulseRing: {
        position: 'absolute',
        top: -10,
        left: -10,
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: 'rgba(76, 175, 80, 0.5)',
        zIndex: 1,
    },
    callerName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    callerSubtext: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 40,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 60,
        marginBottom: 12,
    },
    actionButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: '#ff3b30',
    },
    acceptButton: {
        backgroundColor: '#4cd964',
    },
    labels: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 60,
    },
    label: {
        width: 72,
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
    },
});
