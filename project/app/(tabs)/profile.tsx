//ignOut = async () => {
//     await signOut();
//     router.replace('/login');
//   };

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#007AFF" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Profile</Text>
//         <TouchableOpacity
//           style={styles.signOutButton}
//           onPress={handleSignOut}
//         >
//           <LogOut size={24} color="#FF3B30" />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.content}>
//         <View style={styles.avatarContainer}>
//           <View style={styles.avatar}>
//             <UserIcon size={48} color="#fff" />
//           </View>
//         </View>

//         <View style={styles.formContainer}>
//           <View style={styles.fieldContainer}>
//             <Text style={styles.label}>Display Name</Text>
//             <TextInput
//               style={styles.input}
//               value={displayName}
//               onChangeText={setDisplayName}
//               placeholder="Enter your display name"
//             />
//           </View>

//           <View style={styles.fieldContainer}>
//             <Text style={styles.label}>Phone Number</Text>
//             <TextInput
//               style={[styles.input, styles.inputDisabled]}
//               value={phoneNumber}
//               editable={false}
//             />
//           </View>

//           <TouchableOpacity
//             style={[styles.saveButton, saving && styles.buttonDisabled]}
//             onPress={handleSaveProfile}
//             disabled={saving}
//           >
//             {saving ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.saveButtonText}>Save Changes</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 60,
//     paddingBottom: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   headerTitle: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#1a1a1a',
//   },
//   signOutButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   content: {
//     flex: 1,
//   },
//   avatarContainer: {
//     alignItems: 'center',
//     paddingVertical: 32,
//   },
//   avatar: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: '#007AFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   formContainer: {
//     paddingHorizontal: 20,
//   },
//   fieldContainer: {
//     marginBottom: 24,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#666',
//     marginBottom: 8,
//   },
//   input: {
//     height: 48,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     fontSize: 16,
//     backgroundColor: '#fff',
//   },
//   inputDisabled: {
//     backgroundColor: '#f9f9f9',
//     color: '#999',
//   },
//   saveButton: {
//     height: 48,
//     backgroundColor: '#007AFF',
//     borderRadius: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   buttonDisabled: {
//     opacity: 0.6,
//   },
//   saveButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });


import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, User as UserIcon, Bell } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { ensureDeviceKeys, resetDeviceKeys } from '@/lib/crypto/deviceKeys';
import { useAuth } from '@/contexts/AuthContext';
import AvatarPicker, { AvatarId, getAvatarSource } from '@/components/AvatarPicker';
import { requestNotificationPermissions, areNotificationsEnabled } from '@/lib/notifications';

export default function ProfileScreen() {
  const [displayName, setDisplayName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<AvatarId | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [refreshingKeys, setRefreshingKeys] = useState(false);
  const { session, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      loadProfile();
      checkNotificationStatus();
    }
  }, [session]);

  const checkNotificationStatus = async () => {
    const enabled = await areNotificationsEnabled();
    setNotificationsEnabled(enabled);
  };

  const initializeDeviceKeys = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    const defaultContact =
      session.user.email || session.user.phone || contactEmail || `user-${session.user.id}`;
    const defaultDisplay =
      displayName ||
      session.user.user_metadata?.full_name ||
      (defaultContact.includes('@')
        ? defaultContact.split('@')[0]
        : defaultContact);

    setDeviceStatus('loading');
    setDeviceError(null);

    try {
      await ensureDeviceKeys(session.user.id, 'primary', {
        contact: defaultContact,
        displayName: defaultDisplay,
      });
      setDeviceStatus('ready');
    } catch (error: any) {
      console.warn('[profile] Failed to ensure device keys', error);
      setDeviceStatus('error');
      setDeviceError(error?.message ?? 'Unable to initialize Signal keys for this device.');
    }
  }, [
    session?.user?.id,
    session?.user?.email,
    session?.user?.phone,
    session?.user?.user_metadata?.full_name,
    contactEmail,
    displayName,
  ]);

  useEffect(() => {
    initializeDeviceKeys();
  }, [initializeDeviceKeys]);

  const loadProfile = async () => {
    if (!session?.user) {
      return;
    }

    const contact =
      session.user.email || session.user.phone || `user-${session.user.id}`;

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, phone_number, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.warn('[profile] Failed to fetch profile', error);
    }

    if (!data) {
      const { data: created } = await supabase
        .from('profiles')
        .upsert(
          {
            id: session.user.id,
            phone_number: contact,
            display_name: displayName || contact.split('@')[0] || 'User',
          },
          { onConflict: 'id' }
        )
        .select('display_name, phone_number, avatar_url')
        .single();

      if (created) {
        setDisplayName(created.display_name || '');
        setContactEmail(created.phone_number || contact);
        setAvatarUrl(created.avatar_url as AvatarId | null);
      } else {
        setContactEmail(contact);
      }
    } else {
      setDisplayName(data.display_name || '');
      setContactEmail(data.phone_number || contact);
      setAvatarUrl(data.avatar_url as AvatarId | null);
    }

    setLoading(false);
  };

  const handleRegenerateDeviceKeys = async () => {
    if (!session?.user?.id) {
      return;
    }

    setRefreshingKeys(true);
    setDeviceError(null);

    try {
      const contactHint =
        session.user.email || session.user.phone || contactEmail || `user-${session.user.id}`;
      const displayHint =
        displayName ||
        session.user.user_metadata?.full_name ||
        (contactHint.includes('@') ? contactHint.split('@')[0] : contactHint);

      await resetDeviceKeys();
      await ensureDeviceKeys(session.user.id, 'primary', {
        contact: contactHint,
        displayName: displayHint,
      });
      setDeviceStatus('ready');
      Alert.alert(
        'Device keys updated',
        'A fresh set of Signal keys has been generated and published for this device.'
      );
    } catch (error: any) {
      console.warn('[profile] Failed to regenerate device keys', error);
      setDeviceStatus('error');
      setDeviceError(error?.message ?? 'Unable to regenerate device keys.');
      Alert.alert(
        'Error',
        error?.message ?? 'Unable to regenerate device keys at this time.'
      );
    } finally {
      setRefreshingKeys(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    if (!session?.user?.id) {
      Alert.alert('Error', 'Missing session information. Please sign in again.');
      return;
    }

    setSaving(true);
    const contact =
      session.user.email || session.user.phone || contactEmail || `user-${session.user.id}`;

    // Debug: Log the values being saved
    console.log('[profile] Saving profile with avatar_url:', avatarUrl);

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: session.user.id,
          display_name: displayName,
          phone_number: contact,
          avatar_url: avatarUrl || null,
        },
        { onConflict: 'id' }
      )
      .select('display_name, phone_number, avatar_url')
      .single();

    setSaving(false);

    // Debug: Log the response
    console.log('[profile] Save response:', { data, error });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setDisplayName(data?.display_name || displayName);
    setContactEmail(data?.phone_number || contact);
    setAvatarUrl(data?.avatar_url as AvatarId | null);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      setNotificationsEnabled(granted);
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive message alerts.'
        );
      }
    } else {
      Alert.alert(
        'Notifications',
        'To disable notifications, please go to your device settings.'
      );
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>STATUS</Text>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <LogOut size={20} color="#FF453A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => setShowAvatarPicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            {avatarUrl && getAvatarSource(avatarUrl) ? (
              <Image
                source={getAvatarSource(avatarUrl)}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <UserIcon size={44} color="#4A7C59" />
            )}
          </View>
          <Text style={styles.avatarHint}>TAP TO CHANGE</Text>
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>DISPLAY NAME</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your display name"
              placeholderTextColor="#8E8E93"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>CONTACT INFO</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={contactEmail}
              editable={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#1C1C1E" />
            ) : (
              <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
            )}
          </TouchableOpacity>

          <View style={styles.securitySection}>
            <Text style={styles.sectionTitle}>SECURE MESSAGING</Text>
            <Text style={styles.sectionDescription}>
              {deviceStatus === 'ready'
                ? 'Signal-compatible keys are published for this device.'
                : deviceStatus === 'loading'
                  ? 'Publishing device key bundle...'
                  : 'Device keys are unavailable.'}
            </Text>
            {deviceError ? (
              <Text style={styles.sectionError}>{deviceError}</Text>
            ) : null}
            <TouchableOpacity
              style={[
                styles.keyButton,
                (refreshingKeys || deviceStatus === 'loading') && styles.buttonDisabled,
              ]}
              onPress={handleRegenerateDeviceKeys}
              disabled={refreshingKeys || deviceStatus === 'loading'}
            >
              {refreshingKeys ? (
                <ActivityIndicator color="#F5F5F5" />
              ) : (
                <Text style={styles.keyButtonText}>REGENERATE KEYS</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.notificationSection}>
            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Bell size={20} color="#4A7C59" />
                <Text style={styles.notificationLabel}>NOTIFICATIONS</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#3A3A3C', true: '#4A7C59' }}
                thumbColor={notificationsEnabled ? '#F5F5F5' : '#8E8E93'}
              />
            </View>
            <Text style={styles.notificationHint}>
              Receive alerts when new messages arrive
            </Text>
          </View>
        </View>
      </ScrollView>

      <AvatarPicker
        visible={showAvatarPicker}
        selectedAvatar={avatarUrl}
        onSelect={(id) => setAvatarUrl(id)}
        onClose={() => setShowAvatarPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F5F5F5',
    letterSpacing: 3,
  },
  signOutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  content: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A7C59',
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#2C2C2E',
    color: '#F5F5F5',
  },
  inputDisabled: {
    backgroundColor: '#1C1C1E',
    color: '#8E8E93',
    borderColor: '#2C2C2E',
  },
  saveButton: {
    height: 48,
    backgroundColor: '#4A7C59',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  securitySection: {
    padding: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A7C59',
    marginBottom: 8,
    letterSpacing: 2,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 16,
  },
  sectionError: {
    fontSize: 12,
    color: '#FF453A',
    marginBottom: 12,
    fontWeight: '500',
  },
  keyButton: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyButtonText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1,
  },
  notificationSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F5F5F5',
    letterSpacing: 2,
  },
  notificationHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#8E8E93',
  },
});
