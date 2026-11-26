import React from 'react'
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { C, F } from '../ui/theme'

// Shared shell for Login / Register: logo on the pitch, white form card below.
export default function AuthLayout({ title, subtitle, children, footer }) {
  const insets = useSafeAreaInsets()
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.turf }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[s.wrap, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={s.pitch}>
          <View style={s.centerLine} />
          <View style={s.centerCircle} />
          <Image source={require('../assets/mCapture-removebg-preview.png')} style={s.logo} resizeMode="contain" accessibilityLabel="BookMyTurf" />
        </View>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
        <View style={s.card}>{children}</View>
        <View style={{ marginTop: 18 }}>{footer}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, paddingHorizontal: 22, justifyContent: 'center', maxWidth: 480, width: '100%', alignSelf: 'center' },
  // chalk halfway line + centre circle behind the logo
  pitch: { height: 170, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  centerLine: { position: 'absolute', left: -22, right: -22, top: 85, borderTopWidth: 2, borderColor: 'rgba(255,255,255,0.14)' },
  centerCircle: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)' },
  logo: { width: 190, height: 130 },
  title: { fontFamily: F.display, fontSize: 38, color: C.chalk, lineHeight: 40 },
  subtitle: { fontFamily: F.body, fontSize: 16, color: '#BFD6C8', marginTop: 4, marginBottom: 20 },
  card: { backgroundColor: C.field, borderRadius: 16, padding: 18, paddingBottom: 6 },
})
