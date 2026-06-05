---
name: uploads-cloudinary
description: "Use when working with file upload/download/destroy via Cloudinary, configuring upload limits, or handling image transformations. Triggered by keywords: Cloudinary, upload, image, file, cloudinary."
---

# Uploads (Cloudinary)

## Module

- `UploadersModule` at `src/uploaders/uploaders.module.ts` (not global)
- Provides `UploadersService` at `src/uploaders/uploaders.service.ts`
- Cloudinary initialized from env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Upload Limits (from uploaders.module.ts)

| Constant                  | Value                     |
|---------------------------|---------------------------|
| `MAX_FILE_SIZE_UPLOAD`     | 5,000,000 (5MB)           |
| `MAX_FILE_COUNT`           | 4                         |
| `ALLOWED_MIME_TYPE`        | `image/png\|image/jpeg\|image/jpg` |
| `MIN_LOW_RES_UPLOAD`       | 800px                     |

These are also used by `ProductsController` for `ParseFilePipe` validation on `POST /products/upload-files`.

## Service Methods

- `uploadSingleImage(file, { lowRes })` — uploads to `CLOUDINARY_UPLOAD_FOLDER` or `CLOUDINARY_UPLOAD_LOW_RES_FOLDER`. Low-res transforms to 800px width.
- `getSingleDownloadableImage({ publicId, fileName })` — returns signed download URL
- `destroySingleImage({ publicId })` — deletes from Cloudinary
- Public IDs generated via `generateRandomCode()` from `utils/random.code.ts`

## Usage in Controllers

Cloudinary operations are called from `ProductsController` (`POST /products/upload-files`, `GET /products/files`, `DELETE /products/files`). The upload endpoint uses `FilesInterceptor('files', MAX_FILE_COUNT)` and validates via `ParseFilePipe` with `MaxFileSizeValidator` + `FileTypeValidator`.
