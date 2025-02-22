import { useState } from "react";
import { fetchAI } from "../lib/fetchAI";

export default function App() {
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");

    const handleGenerate = async () => {
        const aiResponse = await fetchAI(input);
        setResponse(aiResponse);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <h1 className="text-2xl font-bold mb-4">AI Travel Assistant</h1>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="p-2 border border-gray-300 rounded-md w-80"
                placeholder="Enter your query..."
            />
            <button
                onClick={handleGenerate}
                className="mt-4 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
                Generate Itinerary
            </button>
            {response && (
                <div className="mt-4 p-3 bg-white border border-gray-300 rounded-md w-80">
                    <p className="text-gray-800">{response}</p>
                </div>
            )}
        </div>
    );
}
