const axios = require("axios");

const SMS_CONFIG = {
    apiId: "APIqJtjEDl3147894",
    apiPassword: "COWTmeXv",
    sender: "OROREG",
    templateId: "",   // ← STPL Template ID inga podu (SmartPing dashboard la irukum)
};

const sendOtpSms = async (mobile, otp) => {
    try {
        if (!mobile) {
            throw new Error("Mobile number is required");
        }

        const message = `Dear User, Your OTP for login to Ororegen Companies is ${otp}. Please do not share this with anyone nVx5PMpNQBI`;

        const url = "https://bulksmsplans.com/api/verify";

        const response = await axios.get(url, {
            params: {
                api_id: SMS_CONFIG.apiId,
                api_password: SMS_CONFIG.apiPassword,
                sms_type: "Transactional",
                sms_encoding: "text",
                sender: SMS_CONFIG.sender,
                number: mobile,
                message,
                var1: otp,
                ...(SMS_CONFIG.templateId && { template_id: SMS_CONFIG.templateId }),
            },
            timeout: 10000,
        });

        console.log("SMS API response:", JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error("SMS sending failed:", error?.response?.data || error.message);
        throw new Error("Failed to send OTP SMS");
    }
};

module.exports = sendOtpSms;