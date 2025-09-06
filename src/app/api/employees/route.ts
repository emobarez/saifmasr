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
    return NextResponse.json(employees);
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

    const employee = await employeeService.create({
      name,
      email,
      phone,
      position,
      department,
      salary: salary ? parseFloat(salary) : undefined,
      hireDate: new Date(hireDate),
      status: status || "ACTIVE"
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}