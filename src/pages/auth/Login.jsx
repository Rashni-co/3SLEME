import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showReset, setShowReset] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Wait a moment for AuthContext to potentially pick up the change, though usually automatic.
            // But we can just navigate to root, and ProtectedRoute will handle role redirection.
            navigate('/');
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset link sent! Check your inbox.');
        } catch (err) {
            setError('Failed to send reset link. User may not exist.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <h2 className="text-2xl font-bold text-center text-army-800 mb-6">
                {showReset ? 'Reset Password' : 'Login'}
            </h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}
            {message && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
                    {message}
                </div>
            )}

            {!showReset ? (
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Email Address"
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <div className="text-right mb-4">
                        <button
                            type="button"
                            onClick={() => setShowReset(true)}
                            className="text-xs text-army-600 hover:text-army-800 hover:underline"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleReset}>
                    <p className="text-sm text-gray-600 mb-4 text-center">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <Input
                        label="Email Address"
                        type="email"
                        id="reset-email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                    <button
                        type="button"
                        onClick={() => { setShowReset(false); setError(''); setMessage(''); }}
                        className="w-full mt-3 text-sm text-army-600 hover:text-army-800"
                    >
                        &larr; Back to Login
                    </button>
                </form>
            )}

            {!showReset && (
                <div className="mt-4 text-center text-sm text-army-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-army-800 font-semibold hover:underline">
                        Register
                    </Link>
                </div>
            )}
        </Card>
    );
}
