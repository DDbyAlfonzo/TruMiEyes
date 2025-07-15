// pages/upload.js
import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import firebase from '../../lib/firebase';
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("auth") !== "true") {
      router.push("/login");
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    const fileRef = ref(storage, `uploads/${uuidv4()}-${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    setSuccess(`Uploaded! Public URL: ${url}`);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Upload File</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      {success && <p>{success}</p>}
    </div>
  );
}
