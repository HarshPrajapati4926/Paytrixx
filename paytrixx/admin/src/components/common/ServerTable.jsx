import React from "react";
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, Skeleton, Typography,
} from "@mui/material";

/**
 * Generic server-paginated table.
 * columns: [{ key, label, render?(row), align?, width? }]
 */
const ServerTable = ({
  columns,
  rows = [],
  total = 0,
  page,
  limit,
  onPageChange,
  onLimitChange,
  loading,
  toolbar,
  empty = "No records found",
  onRowClick,
}) => (
  <Card className="rmui-card bg-f6f7f9 border" sx={{ boxShadow: "none", borderRadius: "7px" }}>
    {toolbar && <Box sx={{ p: "16px 20px" }}>{toolbar}</Box>}

    <Box className="bg-white border-top" sx={{ borderRadius: "7px 7px 0 0", overflowX: "auto" }}>
      <TableContainer>
        <Table size="small">
          <TableHead className="bg-primary-50">
            <TableRow>
              {columns.map((c) => (
                <TableCell
                  key={c.key}
                  align={c.align}
                  sx={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", width: c.width }}
                >
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.key}><Skeleton height={22} /></TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <Typography sx={{ fontSize: 14 }}>{empty}</Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              rows.map((row, i) => (
                <TableRow
                  key={row._id || row.id || i}
                  hover
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{ cursor: onRowClick ? "pointer" : "default" }}
                >
                  {columns.map((c) => (
                    <TableCell key={c.key} align={c.align} sx={{ fontSize: 13 }}>
                      {c.render ? c.render(row) : row[c.key] ?? "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[10, 25, 50, 100]}
        onPageChange={(_, p) => onPageChange(p)}
        onRowsPerPageChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
      />
    </Box>
  </Card>
);

export default ServerTable;
