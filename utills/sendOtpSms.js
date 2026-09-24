const axios = require("axios");

const MSG91_TEMPLATE_ID = "6ab4ee2b3db0f7fc9a0fcce3";

const sendOtpSms = async (mobile, otp) => {
    try {
        if (!mobile) throw new Error("Mobile number is required");

        const mobileWithCode = String(mobile).startsWith("91") ? String(mobile) : `91${mobile}`;

        const response = await axios.post(
            "https://control.msg91.com/api/v5/otp",
            {
                template_id: MSG91_TEMPLATE_ID,
                mobile: mobileWithCode,
                otp: String(otp),
            },
            {
                headers: {
                    authkey: process.env.MSG91_AUTH_KEY,
                    "Content-Type": "application/json",
                },
                timeout: 10000,
            }
        );

        console.log("MSG91 SMS response:", JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error("SMS sending failed:", error?.response?.data || error.message);
        throw new Error("Failed to send OTP SMS");
    }
};

module.exports = sendOtpSms;
