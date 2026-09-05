import { API_BASE_URL, getToken } from '@/lib/apiClient';

export async function uploadImage(file) {
  const token = getToken();
  const formData = new FormData();
  formData.append('image', file);

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to upload image');
  }

  const data = await response.json();
  return data.url; // Assuming the backend returns { url: 'http://...' }
}
