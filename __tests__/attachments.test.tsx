import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AttachmentsPanel from '@/components/AttachmentsPanel';
import { validateFile, formatBytes } from '@/lib/attachments';

const show = jest.fn();
jest.mock('@/components/Toast', () => ({ useToast: () => ({ show }) }));
jest.mock('@/lib/attachments', () => {
  const actual = jest.requireActual('@/lib/attachments');
  return {
    ...actual,
    listAttachments: jest.fn(),
    uploadAttachment: jest.fn(),
    fetchAttachmentBlob: jest.fn(() => Promise.resolve(new Blob(['x']))),
    deleteAttachment: jest.fn(() => Promise.resolve()),
  };
});
import { listAttachments, uploadAttachment, deleteAttachment } from '@/lib/attachments';

const doc = { id: 1, ticket_id: 7, filename: 'report.pdf', mime_type: 'application/pdf', size: 2048, uploaded_by: 2, uploader_name: 'Bilal Agent', created_at: new Date().toISOString() };

beforeEach(() => {
  jest.clearAllMocks();
  (listAttachments as jest.Mock).mockResolvedValue([doc]);
  window.confirm = jest.fn(() => true);
  (global as any).URL.createObjectURL = jest.fn(() => 'blob:x');
  (global as any).URL.revokeObjectURL = jest.fn();
});

describe('validateFile', () => {
  const f = (name: string, type: string, size = 100) => new File([new Uint8Array(size)], name, { type });
  test('accepts allowed types and rejects the rest', () => {
    expect(validateFile(f('a.png', 'image/png'))).toBeNull();
    expect(validateFile(f('a.pdf', 'application/pdf'))).toBeNull();
    expect(validateFile(f('a.csv', 'application/vnd.ms-excel'))).toBeNull();
    expect(validateFile(f('a.svg', 'image/svg+xml'))).toMatch(/Only images/);
    expect(validateFile(f('a.exe', 'application/x-msdownload'))).toMatch(/Only images/);
  });
  test('rejects empty and over-2MB files', () => {
    expect(validateFile(f('a.png', 'image/png', 0))).toMatch(/empty/);
    expect(validateFile(f('big.png', 'image/png', 2 * 1024 * 1024 + 1))).toMatch(/larger than 2 MB/);
  });
  test('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('AttachmentsPanel', () => {
  test('lists files with size and uploader', async () => {
    render(<AttachmentsPanel ticketId={7} meId={9} isStaff={false} />);
    expect(await screen.findByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText(/2.0 KB · Bilal Agent/)).toBeInTheDocument();
  });

  test('a customer cannot delete a file someone else uploaded, staff can', async () => {
    const { unmount } = render(<AttachmentsPanel ticketId={7} meId={9} isStaff={false} />);
    await screen.findByText('report.pdf');
    expect(screen.queryByLabelText('Delete report.pdf')).toBeNull();
    unmount();
    render(<AttachmentsPanel ticketId={7} meId={3} isStaff />);
    fireEvent.click(await screen.findByLabelText('Delete report.pdf'));
    await waitFor(() => expect(deleteAttachment).toHaveBeenCalledWith(1));
  });

  test('blocks a bad file before any upload and tells the person why', async () => {
    render(<AttachmentsPanel ticketId={7} meId={9} isStaff={false} />);
    await screen.findByText('report.pdf');
    const bad = new File(['x'], 'run.exe', { type: 'application/x-msdownload' });
    fireEvent.change(screen.getByLabelText('Choose a file'), { target: { files: [bad] } });
    await waitFor(() => expect(show).toHaveBeenCalledWith(expect.stringMatching(/Only images/), 'error'));
    expect(uploadAttachment).not.toHaveBeenCalled();
  });

  test('uploads a good file and adds it to the list', async () => {
    (uploadAttachment as jest.Mock).mockResolvedValue({ ...doc, id: 2, filename: 'shot.png', mime_type: 'image/png' });
    render(<AttachmentsPanel ticketId={7} meId={9} isStaff={false} />);
    await screen.findByText('report.pdf');
    const ok = new File([new Uint8Array(10)], 'shot.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Choose a file'), { target: { files: [ok] } });
    expect(await screen.findByText('shot.png')).toBeInTheDocument();
    expect(uploadAttachment).toHaveBeenCalledWith(7, ok);
    expect(show).toHaveBeenCalledWith('File attached');
  });
});
