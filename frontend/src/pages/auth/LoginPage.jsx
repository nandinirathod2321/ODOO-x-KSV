import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { login } from '../../services/auth.service.js';
import useAuthStore from '../../store/authStore.js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
});

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });
  const setAuth = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.token);
      toast.success('Logged in successfully');
      navigate('/');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center text-neutral-900">VendorBridge Login</h2>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register('email')} className="w-full border rounded px-3 py-2" />
          {errors.email && <p className="text-danger-600 text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" {...register('password')} className="w-full border rounded px-3 py-2" />
          {errors.password && <p className="text-danger-600 text-sm mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={mutation.isPending} className="w-full bg-primary-600 text-white rounded py-2 hover:bg-primary-700">
          {mutation.isPending ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}
