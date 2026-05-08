import type { SupabaseClient } from "@supabase/supabase-js"

export const SIGNATURES_BUCKET = "company-signatures"
export const SIGNATURE_MAX_BYTES = 2 * 1024 * 1024
export const SIGNATURE_ALLOWED_MIME = ["image/png", "image/jpeg", "image/jpg"] as const

export type SignatureUploadResult = { publicUrl: string; path: string }

export class SignatureValidationError extends Error {
  constructor(public readonly code: "invalid-type" | "too-large", message: string) {
    super(message)
    this.name = "SignatureValidationError"
  }
}

export function validateSignatureFile(file: File): void {
  if (!(SIGNATURE_ALLOWED_MIME as readonly string[]).includes(file.type)) {
    throw new SignatureValidationError(
      "invalid-type",
      "არასწორი ფაილის ტიპი. დაშვებულია მხოლოდ PNG ან JPG.",
    )
  }
  if (file.size > SIGNATURE_MAX_BYTES) {
    throw new SignatureValidationError(
      "too-large",
      "ფაილი ძალიან დიდია. მაქსიმალური ზომაა 2MB.",
    )
  }
}

function pathFromPublicUrl(userId: string, signatureUrl: string): string | null {
  const fileName = signatureUrl.split("/").pop()
  return fileName ? `${userId}/${fileName}` : null
}

export async function uploadCompanySignature(
  supabase: SupabaseClient,
  userId: string,
  file: File,
  previousUrl?: string | null,
): Promise<SignatureUploadResult> {
  validateSignatureFile(file)

  if (previousUrl) {
    const previousPath = pathFromPublicUrl(userId, previousUrl)
    if (previousPath) {
      await supabase.storage.from(SIGNATURES_BUCKET).remove([previousPath])
    }
  }

  const fileExt = file.name.split(".").pop() ?? "png"
  const path = `${userId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from(SIGNATURES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(SIGNATURES_BUCKET).getPublicUrl(path)
  return { publicUrl: data.publicUrl, path }
}

export async function removeCompanySignature(
  supabase: SupabaseClient,
  userId: string,
  signatureUrl: string,
): Promise<void> {
  const path = pathFromPublicUrl(userId, signatureUrl)
  if (!path) return
  const { error } = await supabase.storage.from(SIGNATURES_BUCKET).remove([path])
  if (error) throw error
}
