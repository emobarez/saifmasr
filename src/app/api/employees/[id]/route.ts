import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { employeeService } from "@/lib/database-service";

// GET /api/employees/[id] - Get employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await employeeService.getById(params.id);
    
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Map database enum values to frontend expected values
    const mappedEmployee = {
      ...employee,
      status: employee.status.toLowerCase().replace('_', '-'), // ACTIVE -> active, ON_LEAVE -> on-leave
      location: employee.department || "غير محدد", // Use department as location fallback
      experience: "غير محدد", // Default value since not in DB
      certifications: [] // Default empty array since not in DB
    };

    return NextResponse.json(mappedEmployee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

// PATCH /api/employees/[id] - Update employee
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData = await request.json();
    
    // Convert date fields if present
    if (updateData.hireDate) {
      updateData.hireDate = new Date(updateData.hireDate);
    }
    
    // Convert salary to float if present
    if (updateData.salary) {
      updateData.salary = parseFloat(updateData.salary);
    }

    // Map frontend status values to database enum values
    if (updateData.status) {
      const statusMap: { [key: string]: string } = {
        'active': 'ACTIVE',
        'inactive': 'INACTIVE',
        'on-leave': 'ON_LEAVE'
      };
      updateData.status = statusMap[updateData.status] || updateData.status;
    }

    // Filter out fields that don't exist in the database schema
    const { location, experience, certifications, ...dbUpdateData } = updateData;

    const employee = await employeeService.update(params.id, dbUpdateData);
    
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await employeeService.delete(params.id);
    
    if (!success) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}