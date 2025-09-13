import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { employeeService } from "@/lib/database-service";

// GET /api/employees - Get all employees
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employees = await employeeService.getAll();
    
    // Map database enum values to frontend expected values
    const mappedEmployees = employees.map(employee => ({
      ...employee,
      status: employee.status.toLowerCase().replace('_', '-'), // ACTIVE -> active, ON_LEAVE -> on-leave
      location: employee.department || "غير محدد", // Use department as location fallback
      experience: "غير محدد", // Default value since not in DB
      certifications: [] // Default empty array since not in DB
    }));

    return NextResponse.json(mappedEmployees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create a new employee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone, position, department, salary, hireDate, status } = await request.json();

    if (!name || !email || !position || !hireDate) {
      return NextResponse.json(
        { error: "Name, email, position, and hire date are required" },
        { status: 400 }
      );
    }

    // Map frontend status to database enum
    let dbStatus = "ACTIVE";
    if (status) {
      const statusMap: { [key: string]: string } = {
        'active': 'ACTIVE',
        'inactive': 'INACTIVE',
        'on-leave': 'ON_LEAVE'
      };
      dbStatus = statusMap[status] || "ACTIVE";
    }

    const employee = await employeeService.create({
      name,
      email,
      phone,
      position,
      department,
      salary: salary ? parseFloat(salary) : undefined,
      hireDate: new Date(hireDate),
      status: dbStatus as "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED"
    });

    // Map response back to frontend format
    const mappedEmployee = {
      ...employee,
      status: employee.status.toLowerCase().replace('_', '-'),
      location: employee.department || "غير محدد",
      experience: "غير محدد",
      certifications: []
    };

    return NextResponse.json(mappedEmployee, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}