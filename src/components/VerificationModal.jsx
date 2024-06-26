import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useUserData } from "../hooks/useUserData";

export const VerificationModal = ({ isOpen, onClose }) => {
  const { resendVerificationEmail, session } = useAuth();
  const [isDisabled, setIsDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timeoutDuration = 60;
  const { is_verified } = useUserData();
  console.log(is_verified);

  const handleResendEmail = async () => {
    setIsDisabled(true);
    setCountdown(timeoutDuration);
    await resendVerificationEmail();
    alert("Verification email resent. Please check your inbox.");

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOkay = async () => {
    localStorage.setItem(
      "session",
      JSON.stringify({
        ...session,
        user: { ...session.user, is_verified },
      })
    );

    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div
        className={`p-8 rounded-md w-96 max-w-full text-center 
        ${useTheme().theme === "light" ? "bg-white" : "bg-dark"}
      `}
      >
        <h2 className="text-xl font-semibold mb-4">
          Email Verification Required
        </h2>
        <p className="mb-4">
          Please verify your email to continue using the application.
        </p>
        <button
          type="button"
          onClick={handleOkay}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Check Verification
        </button>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("selectedNav");
            localStorage.removeItem("session");
            window.location.reload();
          }}
          className="bg-red-500 text-white px-4 py-2 rounded ml-4"
        >
          Sign Out
        </button>
        <button
          className="bg-green-500 text-white px-1 py-2 rounded mt-2"
          onClick={handleResendEmail}
          disabled={isDisabled}
        >
          {isDisabled ? `Resend in ${countdown}s` : "Resend Verification Email"}
        </button>
      </div>
    </div>
  );
};
