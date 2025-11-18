const axios = require('axios');

const sendSMS = async (phone, message) => {
    try {
        const cleanedPhone = '91' + phone.toString().replace(/\D/g, '');
        
        console.log(`📱 Sending FREE SMS via MSG91:`);
        console.log(`   To: +${cleanedPhone}`);
        console.log(`   Message: ${message}`);

        if (!process.env.MSG91_AUTH_KEY) {
            throw new Error('MSG91 Auth Key not found');
        }

        // Use default approved sender ID
        const response = await axios.post('https://api.msg91.com/api/v2/sendsms', {
            sender: "MSGIND",  // ✅ Use default approved sender ID
            route: "4",        // Transactional route
            country: "91",     // Country code
            sms: [{
                message: message,
                to: [cleanedPhone]
            }]
        }, {
            headers: {
                'authkey': process.env.MSG91_AUTH_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('✅ MSG91 Response:', response.data);

        if (response.data.type === 'success') {
            console.log('🎉 FREE SMS SENT SUCCESSFULLY!');
            console.log(`📱 Delivered to: +${cleanedPhone}`);
            
            return {
                success: true,
                provider: 'msg91',
                messageId: response.data.messageId,
                realSMS: true,
                free: true
            };
        } else {
            throw new Error(`MSG91 error: ${response.data.message}`);
        }

    } catch (error) {
        console.error('❌ MSG91 SMS failed:');
        console.error('   Error:', error.message);
        
        if (error.response?.data) {
            console.error('   API Error:', error.response.data);
        }
        
        throw new Error(`SMS delivery failed: ${error.message}`);
    }
};

module.exports = { sendSMS };