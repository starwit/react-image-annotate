// @flow

import React, {memo, useRef} from "react"
import Paper from "@mui/material/Paper"
import {createTheme, styled, ThemeProvider} from "@mui/material/styles"
import styles from "./styles"
import IconButton from "@mui/material/IconButton"
import Button from "@mui/material/Button"
import TrashIcon from "@mui/icons-material/Delete"
import CheckIcon from "@mui/icons-material/Check"
import TextField from "@mui/material/TextField"
import {useTranslation} from "react-i18next"
import Alert from '@mui/material/Alert';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { North, NorthEast, East, SouthEast, South, SouthWest, West, NorthWest} from '@mui/icons-material';

const theme = createTheme()
const StyledPaper = styled(Paper)(({ theme }) => styles.regionInfo)

export const RegionLabel = ({
  region,
  editing,
  onDelete,
  onChange,
  onClose,
  onOpen,
  enabledProperties
}) => {
  const {t} = useTranslation();
  const nameInputRef = useRef(null)
  const onNameInputClick = (_) => {
    const nameInput = nameInputRef.current.children[1].children[0]

    if (nameInput) return nameInput.focus()
  }

  return (
    <ThemeProvider theme={theme}>
      <StyledPaper
        onClick={() => (!editing ? onOpen(region) : null)}
        className={region.highlighted ? "highlighted" : ""}
      >
        {!editing ? (
          <div>
            {region.cls && (
              <div className="name">
                <div
                  className="circle"
                  style={{backgroundColor: region.color}}
                />
                <Typography variant="caption" fontWeight="bold">{region.cls}</Typography>
              </div>
            )}
            {region.name && (
              <div className="tags">
                <div key="name">
                  <Typography variant="caption" fontWeight="bold">
                    {region.name}{region.direction && <Typography variant="caption"> ({t(`direction.${region.direction}`)})</Typography>}
                  </Typography>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{display: "flex", flexDirection: "row"}}>
              <div
                style={{
                  display: "flex",
                  backgroundColor: region.color || "#888",
                  color: "#fff",
                  padding: 4,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 4,
                  fontWeight: "bold",
                  textShadow: "0px 0px 5px rgba(0,0,0,0.4)",
                }}
              >
                {region.type}
              </div>
              <div style={{flexGrow: 1}} />
              <IconButton
                onClick={() => onDelete(region)}
                tabIndex={-1}
                style={{width: 22, height: 22}}
                size="small"
                variant="outlined"
              >
                <TrashIcon style={{marginTop: -8, width: 16, height: 16}} />
              </IconButton>
            </div>
            {enabledProperties.includes("name") && (
              <TextField
                id="nameField"
                label={t("region.label")}
                ref={nameInputRef}
                onClick={onNameInputClick}
                style={styles.nameField}
                value={region.name || ""}
                onChange={(event) =>
                  onChange({...(region), name: event.target.value})
                }
                autoFocus
                focused={true}
                autoComplete="off"
              />
            )}
            {enabledProperties.includes("line-direction") && region.type === "line" && (
              <Box>
                <Typography variant="caption">
                  {t("region.label.direction")}: {region.direction ? t(`direction.${region.direction}`) : t("direction.none")}
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  value={region.direction}
                  exclusive
                  onChange={(_, newDirection) => onChange({...(region), direction: newDirection})}
                >
                  <ToggleButton value={"N"}><North /></ToggleButton>
                  <ToggleButton value={"NE"}><NorthEast /></ToggleButton>
                  <ToggleButton value={"E"}><East /></ToggleButton>
                  <ToggleButton value={"SE"}><SouthEast /></ToggleButton>
                  <ToggleButton value={"S"}><South /></ToggleButton>
                  <ToggleButton value={"SW"}><SouthWest /></ToggleButton>
                  <ToggleButton value={"W"}><West /></ToggleButton>
                  <ToggleButton value={"NW"}><NorthWest /></ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}
            {onClose && (
              <div style={styles.div}>
                  <div>
                    {region?.falseInput ?
                      <Alert style={styles.alert} severity="error">{t("region.no.name")}</Alert> : <></>
                    }
                  </div>
                <Button
                  onClick={() => onClose(region)}
                  size="small"
                  variant="contained"
                  color="primary"
                >
                  <CheckIcon />
                </Button>
              </div>
            )}
          </div>
        )}
      </StyledPaper>
    </ThemeProvider>
  )
}

export default memo(
  RegionLabel,
  (prevProps, nextProps) =>
    prevProps.editing === nextProps.editing &&
    prevProps.region === nextProps.region
)
