import React, { useContext, useEffect } from "react";
import { AuthContext } from "../contexts/authContext";
import { Box, Container, Skeleton } from "@mui/material";
import Navbar from "../components/Navbar";
import InfoCard from "../components/InfoCard";
import { useNavigate } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";

function ProfilePage() {
  const { user, loading } = useContext(AuthContext);

  return (
    <Box>
      <Navbar />
      <Container sx={{ marginTop: "16px" }}>
        <Box>{loading ? <SkeletonLoader /> : <InfoCard user={user} />}</Box>
      </Container>
    </Box>
  );
}

export default ProfilePage;
