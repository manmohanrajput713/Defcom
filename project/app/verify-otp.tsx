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
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { useAuth } from '@/contexts/AuthContext';

// export default function VerifyOtpScreen() {
//   const [otp, setOtp] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { verifyOtp, signInWithPhone } = useAuth();
//   const router = useRouter();
//   const { phone } = useLocalSearchParams<{ phone: string }>();

//   const handleVerifyOtp = async () => {
//     if (!otp || otp.length < 6) {
//       Alert.alert('Error', 'Please enter a valid OTP');
//       return;
//     }

//     setLoading(true);
//     const { error } = await verifyOtp(phone, otp);
//     setLoading(false);

//     if (error) {
//       Alert.alert('Error', error.message);
//     } else {
//       router.replace('/(tabs)');
//     }
//   };

//   const handleResendOtp = async () => {
//     setLoading(true);
//     const { error } = await signInWithPhone(phone);
//     setLoading(false);

//     if (error) {
//       Alert.alert('Error', error.message);
//     } else {
//       Alert.alert('Success', 'OTP resent successfully');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.content}>
//         <Text style={styles.title}>Verify OTP</Text>
//         <Text style={styles.subtitle}>
//           Enter the code sent to {phone}
//         </Text>

//         <View style={styles.inputContainer}>
//           <TextInput
//             style={styles.input}
//             placeholder="Enter 6-digit OTP"
//             value={otp}
//             onChangeText={setOtp}
//             keyboardType="number-pad"
//             maxLength={6}
//             editable={!loading}
//             autoFocus
//           />
//         </View>

//         <TouchableOpacity
//           style={[styles.button, loading && styles.buttonDisabled]}
//           onPress={handleVerifyOtp}
//           disabled={loading}
//         >
//           {loading ? (
//             <ActivityIndicator color="#fff" />
//           ) : (
//             <Text style={styles.buttonText}>Verify</Text>
//           )}
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.resendButton}
//           onPress={handleResendOtp}
//           disabled={loading}
//         >
//           <Text style={styles.resendText}>Resend OTP</Text>
//         </TouchableOpacity>
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
//     fontSize: 24,
//     backgroundColor: '#f9f9f9',
//     textAlign: 'center',
//     letterSpacing: 8,
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
//   resendButton: {
//     padding: 12,
//     alignItems: 'center',
//   },
//   resendText: {
//     color: '#007AFF',
//     fontSize: 16,
//     fontWeight: '600',
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react-native';

export default function VerifyOtpScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOtp, signInWithEmail } = useAuth();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }

    setLoading(true);
    const { error } = await verifyOtp(email, otp);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    const { error } = await signInWithEmail(email);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Code sent successfully');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />

      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Lock size={40} color="#4A7C59" strokeWidth={2} />
          </View>
          <Text style={styles.headerTitle}>VERIFICATION</Text>
          <Text style={styles.headerSubtitle}>CODE SENT TO</Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>ENTER 6-DIGIT CODE</Text>
          <TextInput
            style={styles.input}
            placeholder="------"
            placeholderTextColor="#3A3A3C"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOtp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#1C1C1E" />
            ) : (
              <Text style={styles.buttonText}>CONFIRM ACCESS</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendOtp}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.resendText}>RESEND CODE</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.statusIndicator} />
        <Text style={styles.footerText}>AWAITING VERIFICATION</Text>
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4A7C59',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F5F5F5',
    letterSpacing: 4,
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    letterSpacing: 2,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#4A7C59',
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    height: 64,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 28,
    backgroundColor: '#1C1C1E',
    color: '#F5F5F5',
    textAlign: 'center',
    letterSpacing: 12,
    fontWeight: '700',
    marginBottom: 20,
  },
  button: {
    height: 52,
    backgroundColor: '#4A7C59',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
  resendButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderRadius: 8,
  },
  resendText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
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
    backgroundColor: '#D4A017',
  },
  footerText: {
    fontSize: 11,
    color: '#8E8E93',
    letterSpacing: 2,
    fontWeight: '500',
  },
});