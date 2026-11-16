import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const emptyProfile = {
  phone: "",
  location: "",
  education: "",
  skills: "",
  resume_url: "",
  bio: "",
};

const MAX_RESUME_SIZE = 5 * 1024 * 1024;

function getErrorMessage(data, fallback) {
  const detail = data?.detail;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).filter(Boolean).join(", ") || fallback;
  }

  return fallback;
}

export default function CandidateProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);

  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [resumeMessage, setResumeMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await fetch(`${API_URL}/candidate-profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login", { replace: true });
          return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Unable to load your profile.")
          );
        }

        if (active) {
          setProfile({
            phone: data.phone || "",
            location: data.location || "",
            education: data.education || "",
            skills: data.skills || "",
            resume_url: data.resume_url || "",
            bio: data.bio || "",
          });
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load your profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({ ...previous, [name]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setSaving(true);

    try {
      const { resume_url, ...profileFields } = profile;

      const response = await fetch(`${API_URL}/candidate-profile/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileFields),
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to save your profile.")
        );
      }

      setProfile((previous) => ({
        ...previous,
        phone: data.phone || "",
        location: data.location || "",
        education: data.education || "",
        skills: data.skills || "",
        bio: data.bio || "",
        resume_url: data.resume_url || previous.resume_url,
      }));

      setSuccess("Your profile has been saved successfully.");
    } catch (err) {
      setError(err.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;

    setResumeError("");
    setResumeMessage("");

    if (!file) {
      setResumeFile(null);
      return;
    }

    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setResumeFile(null);
      event.target.value = "";
      setResumeError("Please select a PDF resume.");
      return;
    }

    if (file.size > MAX_RESUME_SIZE) {
      setResumeFile(null);
      event.target.value = "";
      setResumeError("Resume must be 5 MB or smaller.");
      return;
    }

    setResumeFile(file);
  }

  // This is a button handler, not a nested form submission.
  async function handleResumeUpload() {
    setResumeError("");
    setResumeMessage("");

    if (!resumeFile) {
      setResumeError("Please select a PDF file first.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const formData = new FormData();
    formData.append("file", resumeFile);

    setUploadingResume(true);

    try {
      const response = await fetch(
        `${API_URL}/candidate-profile/me/resume`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Resume upload failed."));
      }

      setProfile((previous) => ({
        ...previous,
        resume_url: data.resume_url || "/candidate-profile/me/resume",
      }));

      setResumeFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setResumeMessage("Resume uploaded successfully.");
    } catch (err) {
      setResumeError(err.message || "Resume upload failed.");
    } finally {
      setUploadingResume(false);
    }
  }

  async function handleResumeDownload() {
    setResumeError("");
    setResumeMessage("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setDownloadingResume(true);

    try {
      const response = await fetch(
        `${API_URL}/candidate-profile/me/resume`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          getErrorMessage(data, "Unable to download your resume.")
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = "resume.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Give the browser time to start the download before releasing the URL.
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      setResumeError(err.message || "Unable to download your resume.");
    } finally {
      setDownloadingResume(false);
    }
  }

  async function handleResumeDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your uploaded resume?"
    );

    if (!confirmed) return;

    setResumeError("");
    setResumeMessage("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setDeletingResume(true);

    try {
      const response = await fetch(
        `${API_URL}/candidate-profile/me/resume`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          getErrorMessage(data, "Unable to delete your resume.")
        );
      }

      setProfile((previous) => ({ ...previous, resume_url: "" }));
      setResumeFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setResumeMessage("Resume deleted successfully.");
    } catch (err) {
      setResumeError(err.message || "Unable to delete your resume.");
    } finally {
      setDeletingResume(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/candidate")}
          className="mb-5 font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Dashboard
        </button>

        <header className="mb-6">
          <p className="font-semibold text-indigo-600">JOBNEST CAREERS</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Candidate Profile
          </h1>
          <p className="mt-2 text-gray-600">
            Update your professional information and upload your resume to
            help recruiters understand your qualifications.
          </p>
        </header>

        {/* Only one form submits profile details. Resume upload is a button. */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Contact Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={20}
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="text-sm font-medium text-gray-700"
                >
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  maxLength={150}
                  value={profile.location}
                  onChange={handleChange}
                  placeholder="e.g. Bhubaneswar, Odisha"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Professional Information
            </h2>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="education"
                  className="text-sm font-medium text-gray-700"
                >
                  Education
                </label>
                <input
                  id="education"
                  name="education"
                  maxLength={200}
                  value={profile.education}
                  onChange={handleChange}
                  placeholder="e.g. Master of Computer Applications"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="skills"
                  className="text-sm font-medium text-gray-700"
                >
                  Skills
                </label>
                <textarea
                  id="skills"
                  name="skills"
                  rows={3}
                  value={profile.skills}
                  onChange={handleChange}
                  placeholder="e.g. Python, FastAPI, React, SQL"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate your skills with commas.
                </p>
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="text-sm font-medium text-gray-700"
                >
                  Professional Summary
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={profile.bio}
                  onChange={handleChange}
                  placeholder="Write a short introduction about your experience and career goals."
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900">My Resume</h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload a PDF resume. Maximum file size: 5 MB.
            </p>

            {profile.resume_url && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-green-800">
                      Resume uploaded
                    </p>
                    <p className="mt-1 text-sm text-green-700">
                      Your resume is saved on the server.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-green-700">
                    PDF
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleResumeDownload}
                    disabled={downloadingResume}
                    className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {downloadingResume ? "Downloading..." : "Download Resume"}
                  </button>

                  <button
                    type="button"
                    onClick={handleResumeDelete}
                    disabled={deletingResume}
                    className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingResume ? "Deleting..." : "Delete Resume"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="resume-file"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  {profile.resume_url
                    ? "Choose a replacement PDF"
                    : "Choose your resume"}
                </label>

                <input
                  ref={fileInputRef}
                  id="resume-file"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="block w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              {resumeFile && (
                <p className="text-sm text-gray-600">
                  Selected: {resumeFile.name} (
                  {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}

              {resumeError && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {resumeError}
                </p>
              )}

              {resumeMessage && (
                <p
                  role="status"
                  className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
                >
                  {resumeMessage}
                </p>
              )}

              <button
                type="button"
                onClick={handleResumeUpload}
                disabled={uploadingResume || !resumeFile}
                className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingResume
                  ? "Uploading..."
                  : profile.resume_url
                    ? "Replace Resume"
                    : "Upload Resume"}
              </button>
            </div>
          </section>

          <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/candidate")}
              className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
