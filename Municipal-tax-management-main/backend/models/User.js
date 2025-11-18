const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    customer_id: {
        type: String,
        unique: true,
        required: true
    },
    ward_no: {
        type: String,
        required: true
    },
    old_assessment_no: {
        type: String,
        default: ''
    },
    new_assessment_no: {
        type: String,
        sparse: true  // Changed from unique to sparse to allow empty/null values
    },
    name: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        default: null
    },
    phone_number: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    door_no: {
        type: String,
        required: true
    },
    street: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pin_code: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{6}$/.test(v);
            },
            message: 'PIN code must be 6 digits'
        }
    },
    home_type: {
        type: String,
        enum: ['Residential', 'Commercial', 'Industrial'],
        default: 'Residential'
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    tax_details: {
        property_tax: {
            amount: { type: Number, default: 0 },
            status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
            last_paid_date: Date,
            payment_history: [{
                period: String,
                amount: Number,
                paid_date: Date,
                due_date: Date
            }]
        },
        // Water tax with penalty tracking
    water_tax: {
        amount: { type: Number, default: 0 },
        status: { 
            type: String, 
            enum: ['pending', 'paid', 'partial'], 
            default: 'pending' 
        },
        last_paid_date: Date,
        // Quarterly payment tracking
        q1_paid: { type: Boolean, default: false },
        q2_paid: { type: Boolean, default: false },
        q3_paid: { type: Boolean, default: false },
        q4_paid: { type: Boolean, default: false },
        q1_receipt: { type: String, default: '' },
        q2_receipt: { type: String, default: '' },
        q3_receipt: { type: String, default: '' },
        q4_receipt: { type: String, default: '' },
        // Penalty tracking
        penalty_amount: { type: Number, default: 0 },
        last_penalty_calculated: Date,
        penalty_history: [{
            quarter: String,
            original_amount: Number,
            penalty_amount: Number,
            months_delayed: Number,
            calculated_date: Date,
            paid_date: Date
        }],
        payment_history: [{
            period: String,
            amount: Number,
            paid_date: Date,
            due_date: Date,
            receipt_number: String,
            quarter: String,
            penalty_amount: { type: Number, default: 0 },
            original_amount: { type: Number, default: 0 }
        }]
    }
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);