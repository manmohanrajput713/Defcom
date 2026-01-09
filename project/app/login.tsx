// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { useAuth } from '@/contexts/AuthContext';

// export default function LoginScreen() {
//   const [phone, setPhone] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { signInWithPhone } = useAuth();
//   const router = useRouter();

//   const handleSendOtp = async () => {
//     if (!phone || phone.length < 10) {
//       Alert.alert('Error', 'Please enter a valid phone number');
//       return;
//     }

//     setLoading(true);
//     const { error } = await signInWithPhone(phone);
//     setLoading(false);

//     if (error) {
//       Alert.alert('Error', error.message);
//     } else {
//       router.push({ pathname: '/verify-otp', params: { phone } });
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.content}>
//         <Text style={styles.title}>Welcome to ChatApp</Text>
//         <Text style={styles.subtitle}>Enter your phone number to continue</Text>

//         <View style={styles.inputContainer}>
//           <TextInput
//             style={styles.input}
//             placeholder="Phone number (e.g., +1234567890)"
//             value={phone}
//             onChangeText={setPhone}
//             keyboardType="phone-pad"
//             autoComplete="tel"
//             editable={!loading}
//           />
//         </View>

//         <TouchableOpacity
//           style={[styles.button, loading && styles.buttonDisabled]}
//           onPress={handleSendOtp}
//           disabled={loading}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text style={styles.buttonText}>Send OTP</Text>
//           )}
//         </TouchableOpacity>

//         <Text style={styles.infoText}>
//           You'll receive a verification code via SMS
//         </Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'center',
//     paddingHorizontal: 24,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#1a1a1a',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//     marginBottom: 40,
//     textAlign: 'center',
//   },
//   inputContainer: {
//     marginBottom: 24,
//   },
//   input: {
//     height: 56,
//     borderWidth: 2,
//     borderColor: '#e0e0e0',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     fontSize: 16,
//     backgroundColor: '#f9f9f9',
//   },
//   button: {
//     height: 56,
//     backgroundColor: '#007AFF',
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   buttonDisabled: {
//     opacity: 0.6,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
//   infoText: {
//     fontSize: 14,
//     color: '#999',
//     textAlign: 'center',
//   },
// });


import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail } = useAuth();
  const router = useRouter();

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const { error } = await signInWithEmail(email);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.push({ pathname: '/verify-otp', params: { email } });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />

      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.iconContainer}>
            <Shield size={48} color="#4A7C59" strokeWidth={2} />
          </View>
          <Text style={styles.appName}>DEFCOM</Text>
          <Text style={styles.tagline}>SECURE COMMUNICATIONS</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.headerText}>AUTHENTICATE</Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#8E8E93"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#1C1C1E" />
            ) : (
              <Text style={styles.buttonText}>REQUEST ACCESS</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.infoText}>
            Verification code will be sent to your email
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.statusIndicator} />
        <Text style={styles.footerText}>SYSTEM READY</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4A7C59',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F5F5F5',
    letterSpacing: 6,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 12,
    color: '#8E8E93',
    letterSpacing: 3,
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A7C59',
    letterSpacing: 2,
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#1C1C1E',
    color: '#F5F5F5',
  },
  button: {
    height: 52,
    backgroundColor: '#4A7C59',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A7C59',
  },
  footerText: {
    fontSize: 11,
    color: '#8E8E93',
    letterSpacing: 2,
    fontWeight: '500',
  },
});