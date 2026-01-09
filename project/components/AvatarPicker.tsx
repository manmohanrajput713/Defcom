import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Image,
    ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';

// Avatar presets - these match the images in assets/images/avatars/
export const AVATAR_PRESETS = [
    { id: 'avatar_1', label: 'Soldier' },
    { id: 'avatar_2', label: 'Pilot' },
    { id: 'avatar_3', label: 'Operator' },
    { id: 'avatar_4', label: 'Naval' },
    { id: 'avatar_5', label: 'General' },
    { id: 'avatar_6', label: 'Comms' },
] as const;

export type AvatarId = typeof AVATAR_PRESETS[number]['id'];

// Map avatar IDs to require() images
export const AVATAR_IMAGES: Record<AvatarId, any> = {
    avatar_1: require('../assets/images/avatars/avatar_1.webp'),
    avatar_2: require('../assets/images/avatars/avatar_2.webp'),
    avatar_3: require('../assets/images/avatars/avatar_3.webp'),
    avatar_4: require('../assets/images/avatars/avatar_4.webp'),
    avatar_5: require('../assets/images/avatars/avatar_5.webp'),
    avatar_6: require('../assets/images/avatars/avatar_6.webp'),
};

// Helper to get avatar image source from avatar_url
export function getAvatarSource(avatarUrl: string | null | undefined): any | null {
    if (!avatarUrl) return null;
    const avatarId = avatarUrl as AvatarId;
    return AVATAR_IMAGES[avatarId] || null;
}

interface AvatarPickerProps {
    visible: boolean;
    selectedAvatar: AvatarId | null;
    onSelect: (avatarId: AvatarId) => void;
    onClose: () => void;
}

export default function AvatarPicker({
    visible,
    selectedAvatar,
    onSelect,
    onClose,
}: AvatarPickerProps) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>SELECT AVATAR</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={20} color="#F5F5F5" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.grid}>
                        {AVATAR_PRESETS.map((preset) => {
                            const isSelected = selectedAvatar === preset.id;
                            return (
                                <TouchableOpacity
                                    key={preset.id}
                                    style={[
                                        styles.avatarOption,
                                        isSelected && styles.avatarOptionSelected,
                                    ]}
                                    onPress={() => onSelect(preset.id)}
                                    activeOpacity={0.7}
                                >
                                    <Image
                                        source={AVATAR_IMAGES[preset.id]}
                                        style={styles.avatarImage}
                                        resizeMode="cover"
                                    />
                                    <Text style={styles.avatarLabel}>{preset.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
                        <Text style={styles.confirmButtonText}>CONFIRM</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4A7C59',
        letterSpacing: 2,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2C2C2E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        justifyContent: 'space-around',
    },
    avatarOption: {
        width: '30%',
        aspectRatio: 1,
        margin: 5,
        borderRadius: 12,
        backgroundColor: '#2C2C2E',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#3A3A3C',
        padding: 8,
    },
    avatarOptionSelected: {
        borderColor: '#4A7C59',
        backgroundColor: '#2C3E2E',
    },
    avatarImage: {
        width: '80%',
        height: '70%',
        borderRadius: 8,
    },
    avatarLabel: {
        marginTop: 4,
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    confirmButton: {
        marginHorizontal: 20,
        marginTop: 16,
        height: 48,
        backgroundColor: '#4A7C59',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#F5F5F5',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 2,
    },
});
