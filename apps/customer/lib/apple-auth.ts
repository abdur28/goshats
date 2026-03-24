import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

export async function getAppleCredential(): Promise<{
  identityToken: string;
  nonce: string;
} | null> {
  try {
    const nonce = Math.random().toString(36).substring(2, 10);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) return null;

    return {
      identityToken: credential.identityToken,
      nonce,
    };
  } catch (error: any) {
    if (error.code === "ERR_REQUEST_CANCELED") {
      return null;
    }
    throw error;
  }
}
