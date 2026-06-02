import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_e92t3rp';      // Your Service ID
const PUBLIC_KEY = 'doPi_WuahR2QsGPPk';        // Your Public Key

// Initialize EmailJS
emailjs.init({
  publicKey: PUBLIC_KEY,
});

// ✅ Welcome Email
export const sendWelcomeEmail = async (memberData) => {
    const templateParams = {
        member_name: memberData.name,
        member_email: memberData.email,
        account_number: memberData.accountNumber,
        member_id: memberData.memberId,
        date_joined: new Date().toLocaleDateString(),
    };

    try {
        const result = await emailjs.send(
            SERVICE_ID,
            'template_sii2srm',   // Your Welcome Template ID
            templateParams
        );
        console.log('Welcome email sent!', result);
        return { success: true };
    } catch (error) {
        console.error('Welcome email error:', error);
        return { success: false, error };
    }
};

// ✅ Update/Notification Email
export const sendUpdateEmail = async (memberData, message) => {
    const templateParams = {
        member_name: memberData.name,
        member_email: memberData.email,
        update_message: message,
        date: new Date().toLocaleDateString(),
    };

    try {
        const result = await emailjs.send(
            SERVICE_ID,
            'template_xxxxxxx',   // Your Update Template ID
            templateParams
        );
        console.log('Update email sent!', result);
        return { success: true };
    } catch (error) {
        console.error('Update email error:', error);
        return { success: false, error };
    }
};