import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import EmailIcon from "@mui/icons-material/Email";
import { Input, Stack } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { AuthContext } from "../contexts/authContext";
const bull = (
  <Box
    component="span"
    sx={{ display: "inline-block", mx: "2px", transform: "scale(0.8)" }}
  >
    •
  </Box>
);

export default function InfoCard(props) {
  const [email, setEmail] = React.useState("");
  const { inviteUser, invited } = React.useContext(AuthContext);
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography
          sx={{ fontSize: 14 }}
          color="text.secondary"
          gutterBottom
        >
          User Profile
        </Typography>
        <Typography
          variant="h5"
          component="div"
        >
          {props.user?.displayName || "User Name"}
        </Typography>
        <Typography
          sx={{ mb: 1.5 }}
          color="text.secondary"
        >
          ID : {props.user?.id || "User Id"}
        </Typography>
        <Box>
          <Stack
            direction="row"
            gap={1}
            alignItems="center"
          >
            <EmailIcon />
            <Typography variant="body2">{props.user?.mail || "Not Available"}</Typography>
          </Stack>
          <Stack
            direction="row"
            gap={1}
            alignItems="center"
          >
            <GroupIcon />
            {props.user?.groups.map((group) => (
              <Typography
                key={group}
                variant="body2"
              >
                {group}
              </Typography>
            ))}
          </Stack>
          <Stack
            direction="row"
            gap={1}
            alignItems="center"
          >
            <AssignmentIcon />
            {props.user?.roles.length > 0
              ? props.user?.roles.map((role) => (
                  <Typography
                    key={role}
                    variant="body2"
                  >
                    {role}
                  </Typography>
                ))
              : "No roles Assigned"}
          </Stack>
        </Box>
      </CardContent>
      <CardActions>
        <Stack>
          <label htmlFor="inviteUser">Invite User</label>
          <Input
            onChange={(e) => setEmail(e.target.value)}
            id="inviteUser"
            type="email"
            value={email}
            placeholder="Enter Email Address to Invite User"
          />
          <Button
            onClick={() => {
              inviteUser({
                invitedUserEmailAddress: email,
                inviteRedirectUrl: "http://localhost:4000/profile",
                sendInvitationMessage: true,
              });
              setEmail("");
            }}
          >
            Invite
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}
