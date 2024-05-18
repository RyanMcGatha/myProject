import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseConfig";
import { getUserData, headers } from "./components/Hooks";
import { useTheme } from "../../ThemeContext";
import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { FiArrowRight } from "react-icons/fi";
import {
  useMotionTemplate,
  useMotionValue,
  motion,
  animate,
} from "framer-motion";

const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];

const Messages = ({ selectedChat, selectedChatData, userData, usersData }) => {
  const color = useMotionValue(COLORS_TOP[0]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const containerRef = useRef(null);

  const username = userData?.[0]?.username || "defaultUsername";
  const full_name = userData?.[0]?.full_name || "defaultFullName";

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 20,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, []);
  const backgroundImage = useMotionTemplate`radial-gradient(150% 130% at 50% 0%, #1a1a24 60%, ${color})`;

  useEffect(() => {
    const channel = supabase
      .channel(`room.${selectedChat}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public" },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [selectedChat]);

  useEffect(() => {
    const fetchMessages = async () => {
      const selectParams = encodeURIComponent(
        JSON.stringify({
          chat_id: true,
          user_name: true,
          message_text: true,
          timestamp: true,
          full_name: true,
        })
      );
      const filterParams = encodeURIComponent(
        JSON.stringify({ chat_id: Number(selectedChat) })
      );
      const url = `https://us-east-2.aws.neurelo.com/rest/messages?select=${selectParams}&filter=${filterParams}`;

      try {
        const response = await fetch(url, { method: "GET", headers });
        if (!response.ok) throw new Error("Failed to fetch messages");

        const result = await response.json();
        setMessages(result.data);
      } catch (error) {
        console.error("Fetch messages error:", error.message);
      }
    };

    fetchMessages();
  }, [selectedChat]);

  const handleSendMessage = async (event) => {
    event.preventDefault();

    try {
      const body = JSON.stringify({
        chat_id: Number(selectedChat),
        message_text: message,
        user_name: username,
        full_name: full_name,
      });

      const response = await fetch(
        "https://us-east-2.aws.neurelo.com/rest/messages/__one",
        {
          method: "POST",
          headers: headers,
          body: body,
        }
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to send message");
      }
      setMessage("");
    } catch (error) {
      console.error("There was a problem with your fetch operation:", error);
    }
    try {
      const { error } = await supabase.from("messages").insert({
        chat_id: Number(selectedChat),
        message_text: message,
        user_name: username,
      });
      if (error) {
        console.error("Error inserting message:", error.message);
        return;
      }
    } catch (error) {
      console.error("There was a problem with your fetch operation:", error);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <motion.section
      style={{
        backgroundImage,
      }}
      className="relative h-full w-full"
    >
      <div
        className={`flex flex-col h-full w-full bg-opacity-20  ${
          theme === "light" ? "bg-white" : "bg-dark text-white"
        }`}
      >
        <div
          style={{ height: "8%" }}
          className={`flex items-center justify-between p-4 border-b ${
            theme === "light" ? "border-gray-300" : "border-dark-lighter"
          }`}
        >
          <h2 className="text-xl font-semibold capitalize">
            {selectedChatData.title || selectedChatData.chat_name}
          </h2>

          <div className="flex items-center space-x-2"></div>
        </div>

        <div
          ref={containerRef}
          className="flex flex-col overflow-y-scroll z-10 no-scrollbar w-full p-5"
          style={{ height: "87%" }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id || `${msg.chat_id}-${msg.timestamp}-${msg.user_name}`}
              className={`${
                msg.user_name === username ? "self-end" : "self-start"
              } p-2 mb-4 rounded-lg w-fit flex flex-col max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl`}
            >
              <div
                className={`${
                  msg.user_name === username ? "self-end" : "self-start"
                } flex items-center flex-col gap-2`}
              >
                <img
                  src={
                    usersData && Array.isArray(usersData)
                      ? usersData
                          .filter((user) => user)
                          .find((user) => user.username === msg.user_name)
                          ?.profile_pic || "defaultProfilePicUrl"
                      : "defaultProfilePicUrl"
                  }
                  alt={`${msg.user_name}'s profile`}
                  className={`${
                    msg.user_name === username ? "self-end" : "self-start"
                  } w-10 h-10 rounded-full border border-gray-300`}
                />
                <p
                  className={`text-sm ${
                    theme === "light" ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {msg.user_name} -{" "}
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <span
                  className={`${
                    msg.user_name === username
                      ? "bg-blue-500 text-white rounded-tr-none"
                      : theme === "light"
                      ? "bg-gray-200 text-black"
                      : "bg-dark-lighter text-white rounded-tl-none"
                  } flex w-fit p-3 mt-2 rounded-lg  `}
                >
                  <p className="text-lg">{msg.message_text}</p>
                </span>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSendMessage}
          style={{ eight: "5%" }}
          className={`flex items-center p-4 border-t z-10 ${
            theme === "light" ? "border-gray-300" : "border-dark-lighter"
          }`}
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`flex-grow p-2 border ${
              theme === "light"
                ? "border-gray-300 bg-white"
                : "border-dark-lighter bg-dark-lighter"
            } rounded-lg`}
            placeholder="Type your message..."
          />
          <button
            type="submit"
            className={`ml-2 p-2 ${
              theme === "light"
                ? "bg-blue-500 text-white"
                : "bg-blue-700 text-white"
            } rounded-lg`}
          >
            Send
          </button>
        </form>
      </div>
      <div className="absolute inset-0 z-0 ">
        <Canvas>
          <Stars radius={40} count={9500} factor={2} fade speed={0.01} />
        </Canvas>
      </div>
    </motion.section>
  );
};

export default Messages;
