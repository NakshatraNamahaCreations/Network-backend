const axios = require("axios");

const SMS_CONFIG = {
    apiId: "APIqJtjEDl3147894",
    apiPassword: "COWTmeXv",
    sender: "OROREG",
};

const sendOtpSms = async (mobile, otp) => {
    try {
        if (!mobile) {
            throw new Error("Mobile number is required");
        }

        const message = `	
Dear User, Your OTP for login to Ororegen Companies is ${otp}. Please do not share this with anyone`;

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
                var1: otp || "1245",
            },
            timeout: 10000,
        });

        return response.data;
    } catch (error) {
        console.error(
            "SMS sending failed:",
            error?.response?.data || error.message
        );
        throw new Error("Failed to send OTP SMS");
    }
};

module.exports = sendOtpSms;