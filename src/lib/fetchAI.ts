export async function fetchAI(prompt: string): Promise<string> {
    try {
        const response = await fetch("http://localhost:8000/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch AI response");
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error("Error fetching AI response:", error);
        return "Error fetching AI response. Please try again.";
    }
}
