// This value must come from the authorized candidate-detail RPC, never a public profile.
export function confirmedInterviewPhone(candidate) {
  return candidate?.status === "interview" && candidate.interview_confirmed_at && typeof candidate.phone === "string"
    ? candidate.phone.trim() : "";
}
