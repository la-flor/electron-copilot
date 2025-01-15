import { FormEvent, useState } from "react";
import "./home.css";
import { streamComplete } from "../services/stream";

const Home = () => {
  const [userPrompt, setUserPrompt] = useState("Provide me with a 5 line poem");
  const [response, setResponse] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      for await (const chunk of streamComplete(userPrompt)) {
        setResponse((prev) => prev + chunk);
      }
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div id="home">
      <div id="chat-output">
        {response.split("\\n").map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          id="chat-input"
          rows={10}
          cols={50}
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Type your message here..."
        ></textarea>

        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Home;
