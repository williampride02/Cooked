'use client';

import { supabase } from '@/lib/supabase';

export async function signStoragePathIfNeeded(
  bucket: string,
  pathOrUrl: string | null,
  expiresInSeconds = 60 * 60
): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;

  const { data: signed, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(pathOrUrl, expiresInSeconds);

  if (error || !signed?.signedUrl) return pathOrUrl;
  return signed.signedUrl;
}

export async function signProofUrlIfNeeded(proofUrl: string | null): Promise<string | null> {
  return signStoragePathIfNeeded('proofs', proofUrl, 60 * 60);
}

