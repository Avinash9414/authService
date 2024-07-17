import React, { useContext } from "react";
import Navbar from "../components/Navbar";
import { Box, Button, Container, Typography } from "@mui/material";
import { AuthContext } from "../contexts/authContext";

function LoginPage() {
  const { login } = useContext(AuthContext);
  return (
    <div>
      <Navbar />
      <Container>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          mt={4}
        >
          <Typography variant="h3">Microsoft Auth Flow Login Screen</Typography>
          <Button
            onClick={login}
            variant="outlined"
          >
            login
          </Button>
        </Box>
      </Container>
    </div>
  );
}

export default LoginPage;
