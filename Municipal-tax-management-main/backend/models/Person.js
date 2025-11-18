const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    customer_id: { type: String, index: true },
    name: { type: String },
    phone_number: { type: String },
    ward_no: { type: String },
    door_no: { type: String },
    property_tax_status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
    water_tax_status: { type: String, enum: ['paid', 'pending', 'partial'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Person', personSchema);


