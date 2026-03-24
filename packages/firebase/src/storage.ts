import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTask,
} from "firebase/storage";
import { storage } from "./config";

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

export async function uploadProfilePhoto(
  uid: string,
  uri: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const blob = await uriToBlob(uri);
  const path = `profile-photos/${uid}/${Date.now()}.jpg`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task: UploadTask = uploadBytesResumable(storageRef, blob);

    task.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function uploadDisputePhoto(
  orderId: string,
  uri: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const blob = await uriToBlob(uri);
  const path = `dispute-photos/${orderId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task: UploadTask = uploadBytesResumable(storageRef, blob);

    task.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function deletePhoto(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}
