export const trackToolUsage = async (agent_name: string, tool_name: string, request: any) => {
    const raw = localStorage.getItem('nexira_user');
    const email = raw ? JSON.parse(raw).email : undefined;
    request.email = email;
    await fetch(import.meta.env.VITE_API_URL + '/tracking/track-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        agent_name: agent_name,
        tool_name: tool_name,
        request: request
      })
    });
  };