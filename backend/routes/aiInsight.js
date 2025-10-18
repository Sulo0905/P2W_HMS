import express from "express";
import axios from "axios";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find();
    const patients = await Patient.find();

    const unassignedPatients = patients.filter((p) => !p.assignedDoctor).length;
    const avgPatientsPerDoctor = (patients.length / doctors.length).toFixed(2);

    // 🔹 Prompt AI to return JSON
    const prompt = `
You are an AI assistant for a hospital management system's admin dashboard.
Provide a detailed **work plan in JSON format** to manage doctors and patients efficiently.

Data Summary:
- Total Doctors: ${doctors.length}
- Total Patients: ${patients.length}
- Unassigned Patients: ${unassignedPatients}
- Average Patients per Doctor: ${avgPatientsPerDoctor}

JSON Format:
{
  "prioritized_actions": [
    {
      "action": "string",
      "details": "string",
      "priority": "high|medium|low"
    }
  ],
  "alerts": ["string"]
}

Please output **only valid JSON**.
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "compound-beta-mini",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      }
    );

    // Parse AI response as JSON
    let aiSuggestion;
    try {
      aiSuggestion = JSON.parse(response.data.choices[0].message.content);
    } catch (err) {
      console.error("Failed to parse AI JSON:", err);
      return res.status(500).json({ message: "AI returned invalid JSON" });
    }

    res.json(aiSuggestion);
  } catch (error) {
    console.error(
      "Groq API Error:",
      (error && error.response && error.response.data) ||
        (error && error.message) ||
        error
    );
    res.status(500).json({ message: "Error generating AI insight" });
  }
});

export default router;
