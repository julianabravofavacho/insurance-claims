using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsuranceClaims.Infrastructure.Persistence.Migrations
{
    public partial class AddClaimTypes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClaimTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClaimTypes", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ClaimTypes",
                columns: new[] { "Id", "Name", "IsActive", "DisplayOrder" },
                values: new object[,]
                {
                    { 1, "Colisão", true, 1 },
                    { 2, "Roubo/Furto", true, 2 },
                    { 3, "Danos naturais", true, 3 },
                    { 4, "Incêndio", true, 4 },
                    { 5, "Terceiros", true, 5 },
                    { 6, "Vidros", true, 6 },
                    { 7, "Outros", true, 7 }
                });

            migrationBuilder.AddColumn<int>(
                name: "ClaimTypeId",
                table: "Claims",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_ClaimTypes_Name",
                table: "ClaimTypes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Claims_ClaimTypeId",
                table: "Claims",
                column: "ClaimTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Claims_ClaimTypes_ClaimTypeId",
                table: "Claims",
                column: "ClaimTypeId",
                principalTable: "ClaimTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.DropColumn(
                name: "ClaimType",
                table: "Claims");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ClaimType",
                table: "Claims",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Outros");

            migrationBuilder.DropForeignKey(
                name: "FK_Claims_ClaimTypes_ClaimTypeId",
                table: "Claims");

            migrationBuilder.DropIndex(
                name: "IX_Claims_ClaimTypeId",
                table: "Claims");

            migrationBuilder.DropColumn(
                name: "ClaimTypeId",
                table: "Claims");

            migrationBuilder.DropTable(name: "ClaimTypes");
        }
    }
}
