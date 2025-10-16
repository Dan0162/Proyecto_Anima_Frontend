import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import SignInPage from './auth/SignInPage';

export default function SignInWrapper() {
	// Tests import this file directly and render <SignIn /> without a Router.
	// Wrap in a MemoryRouter so hooks like useNavigate/useLocation work during tests.
	return (
		<MemoryRouter>
			<SignInPage />
		</MemoryRouter>
	);
}
