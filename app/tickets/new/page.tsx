'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';

export default function NewTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    try {
      const ticket = await api.createTicket({ subject, body, priority });
      router.push(`/tickets/${ticket.id}`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 400) {
        setFieldErrors(err.fieldErrors ?? {});
        if (!err.fieldErrors) setGeneralError(err.message);
      } else {
        setGeneralError('Failed to create ticket.');
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg flex flex-col gap-3">
      <h1 className="text-xl font-bold">New ticket</h1>
      {generalError && <p className="text-red-600">{generalError}</p>}
      <div>
        <input
          className="border p-2 w-full"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        {fieldErrors.subject && <p className="text-red-600 text-sm">{fieldErrors.subject}</p>}
      </div>
      <div>
        <textarea
          className="border p-2 w-full"
          placeholder="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {fieldErrors.body && <p className="text-red-600 text-sm">{fieldErrors.body}</p>}
      </div>
      <select className="border p-2" value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      <button className="bg-black text-white p-2" type="submit">
        Create
      </button>
    </form>
  );
}