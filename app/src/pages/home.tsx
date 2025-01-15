import { useState } from "react";
import "./home.css";

const BASE_URL = "http://localhost:11434/";

const Home = () => {
  const [userPrompt, setUserPrompt] = useState("Give me a 5 line poem");
  const [response, setResponse] = useState("");

  const handleSubmit = async () => {
    try {
      const resp = await fetch(BASE_URL + "api/generate", {
        method: "POST",
        body: JSON.stringify({
          model: "llama3.2",
          prompt: userPrompt,
          stream: false,
        }),
      });

      setResponse(JSON.stringify((await resp.json()).response));
    } catch (err) {
      setResponse(JSON.stringify(err));
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
