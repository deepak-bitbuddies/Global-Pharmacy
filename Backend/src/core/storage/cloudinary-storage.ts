import { Readable } from "node:stream"

import { cloudinary } from "./cloudinary-client.js"

/**
 * Generic file storage on Cloudinary, behind the same shape the old local-disk helpers
 * (`proof-document-storage.ts`, `export-storage.ts`) already exposed — this app's deploy target
 * has a read-only filesystem at runtime, so writing to `process.cwd()/storage/...` always failed
 * there even though it worked fine locally (see those two files' git history for the symptom).
 *
 * Always `resource_type: "raw"` — these are proof screenshots/PDFs and generated .xlsx exports,
 * never images we'd want Cloudinary's image pipeline (transforms, format conversion) touching;
 * "raw" stores and serves the bytes back unmodified regardless of content type.
 */
const RESOURCE_TYPE = "raw"

/** Uploads a buffer under `folder/publicId` and returns the `public_id` to store as this file's reference — callers never see a Cloudinary URL directly, only ever fetch bytes back through `downloadFile`. */
export async function uploadFile(buffer: Buffer, folder: string, publicId: string): Promise<{ storageKey: string }> {
  const result = await new Promise<{ public_id: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: RESOURCE_TYPE, folder, public_id: publicId, overwrite: false, unique_filename: false },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload returned no result"))
          return
        }
        resolve(uploadResult)
      },
    )
    Readable.from(buffer).pipe(uploadStream)
  })

  return { storageKey: result.public_id }
}

/** Fetches a previously uploaded file's bytes back by its `public_id` (the `storageKey` `uploadFile` returned). */
export async function downloadFile(storageKey: string): Promise<Buffer> {
  const url = cloudinary.url(storageKey, { resource_type: RESOURCE_TYPE, secure: true })
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Cloudinary file fetch failed (${response.status}) for ${storageKey}`)
  }
  return Buffer.from(await response.arrayBuffer())
}
