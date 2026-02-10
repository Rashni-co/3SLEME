import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function Register() {
    const [formData, setFormData] = useState({
        officerNo: '',
        rank: '',
        name: '',
        mobile: '',
        email: '',
        password: '',
        confirmPassword: '',
        adminCode: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        if (formData.password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Send Verification Email
            await sendEmailVerification(user);

            // 3. Create Firestore Document
            const role = formData.adminCode === 'admin123' ? 'admin' : 'officer';

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                officerNo: formData.officerNo,
                rank: formData.rank,
                name: formData.name,
                mobile: formData.mobile,
                email: formData.email,
                role: role,
                createdAt: serverTimestamp()
            });

            alert(`Registration successful! You are registered as an ${role.toUpperCase()}.`);
            navigate('/login');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to register.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <h2 className="text-2xl font-bold text-center text-army-800 mb-6">Officer Registration</h2>
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Officer No" id="officerNo" value={formData.officerNo} onChange={handleChange} required />
                    <Input label="Rank" id="rank" value={formData.rank} onChange={handleChange} required />
                </div>
                <Input label="Name" id="name" value={formData.name} onChange={handleChange} required />
                <Input label="Mobile Number" id="mobile" value={formData.mobile} onChange={handleChange} required />
                <Input label="Email Address" type="email" id="email" value={formData.email} onChange={handleChange} required />
                <Input label="Password" type="password" id="password" value={formData.password} onChange={handleChange} required />
                <Input label="Confirm Password" type="password" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />

                <div className="pt-2 border-t border-gray-100">
                    <Input label="Admin Code (Optional)" type="password" id="adminCode" placeholder="Enter 'admin123' to create Admin account" value={formData.adminCode} onChange={handleChange} />
                </div>



                <Button type="submit" disabled={loading} className="w-full mt-4">
                    {loading ? 'Creating Account...' : 'Register'}
                </Button>
            </form>
            <div className="mt-4 text-center text-sm text-army-600">
                Already have an account?{' '}
                <Link to="/login" className="text-army-800 font-semibold hover:underline">
                    Login
                </Link>
            </div>
        </Card>
    );
}
