import { getSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/";

export async function fetchWithAuth<T = any>(
  url: string, 
  token: string,
  options: RequestInit = {}
): Promise<{ data: T }> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    cache: 'no-store'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('API Error:', { 
      url, 
      status: response.status, 
      error,
      headers: Object.fromEntries(response.headers.entries())
    });
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchDashboardStats(token: string) {
  try {
    console.log('Fetching dashboard stats with token:', token ? 'Token exists' : 'No token');
    
    // 1. Fetch all clinics
    let clinicList: any[] = [];
    try {
      const response = await fetch(`${API_BASE}clinique/list/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        clinicList = Array.isArray(data) ? data : [];
      } else {
        console.error('Failed to fetch clinics:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
    console.log('Fetched clinics:', clinicList.length, clinicList);

    // 2. Fetch all managers
    let managerList: any[] = [];
    try {
      const response = await fetch(`${API_BASE}accounts/users/by-type/MANAGER/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        managerList = Array.isArray(data) ? data : [];
      } else {
        console.error('Failed to fetch managers:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
    console.log('Fetched managers:', managerList.length, managerList);

    // 3. Récupération des assignations
    let assignments: { clinic_id: number; manager_id: number }[] = [];

    // Méthode 1 : endpoint global (le plus rapide)
    try {
      const res = await fetch(`${API_BASE}clinique/assignments/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Assignments data:', data); // Debug log
        if (Array.isArray(data)) {
          assignments = data.map((item: any) => ({
            clinic_id: Number(item.clinic_id || 0),
            manager_id: Number(item.manager_id || 0),
          })).filter(a => a.clinic_id > 0 && a.manager_id > 0); // Filter out invalid assignments
          console.log('Processed assignments:', assignments); // Debug log
        }
      } else {
        console.error('Failed to fetch assignments:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }

    // Méthode 2 : fallback par manager (toujours fiable)
    if (assignments.length === 0 && managerList.length > 0) {
      for (const manager of managerList) {
        try {
          const res = await fetch(`${API_BASE}clinique/managers/${manager.id}/clinics/`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });

          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list)) {
              list.forEach((clinic: any) => {
                assignments.push({
                  clinic_id: Number(clinic.id),
                  manager_id: Number(manager.id),
                });
              });
            }
          }
        } catch {
          continue;
        }
      }
    }

    // Calculs
    console.log('All clinics:', clinicList); // Debug log
    console.log('All managers:', managerList); // Debug log
    
    const assignedClinicIds = new Set<number>();
    const assignedManagerIds = new Set<number>();
    
    // Process assignments
    assignments.forEach(assignment => {
      if (assignment.clinic_id && assignment.manager_id) {
        assignedClinicIds.add(assignment.clinic_id);
        assignedManagerIds.add(assignment.manager_id);
      }
    });
    
    // Calculate unassigned clinics
    const unassignedClinics = clinicList.filter((c: any) => {
      return !Array.from(assignedClinicIds).includes(c.id);
    });

    return {
      clinics: {
        count: clinicList.length,
        assigned: assignedClinicIds.size,
        unassigned: clinicList.length - assignedClinicIds.size,
      },
      managers: {
        count: managerList.length,
        assigned: assignedManagerIds.size,
        unassigned: managerList.length - assignedManagerIds.size,
      },
      assignments: {
        total: assignments.length,
        unassignedClinics: unassignedClinics.map((c: any) => ({
          id: c.id,
          name: c.name,
          city: c.city ?? "Non renseignée",
          created_at: c.created_at ?? new Date().toISOString(),
        })),
      },
    };
  } catch (err) {
    console.error("Erreur critique fetchDashboardStats :", err);
    return {
      clinics: { count: 0, assigned: 0, unassigned: 0 },
      managers: { count: 0, assigned: 0, unassigned: 0 },
      assignments: { total: 0, unassignedClinics: [] },
    };
  }
}