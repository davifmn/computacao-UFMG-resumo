import time
import sys
import numpy as np
import sympy as sp
from coppeliasim_zmqremoteapi_client import RemoteAPIClient



'''
#################################### Setup #####################################
'''
client = RemoteAPIClient()
sim = client.getObject('sim')

# just in case, close all opened connections
try:
    sim.stopSimulation()
    time.sleep(1)
except:
    pass

print('Connected to remote API server')

emptyBuff = bytearray()  # empty buffer



# Defining Symbols
th1, th2, th3, th4, th5, th6 = sp.symbols('\\theta_1^*, \\theta_2^*, \\theta_3^*, \\theta_4^*, \\theta_5^*, \\theta_6^*')

# Defining Constants
d1 = 0.089159
d4 = 0.10915
d5 = 0.09465
d6 = 0.0823

a2 = -0.425
a3 = -0.39225


def getJacobianUR5():
    J=sp.Matrix([[-a2*sp.sin(th1)*sp.sin(th2) - d6*sp.sin(th1)*sp.sin(th5)*sp.cos(th2 + th3 + th4) - a3*sp.sin(th1)*sp.sin(th2 + th3) + d5*sp.sin(th1)*sp.sin(th2 + th3 + th4) + d6*sp.cos(th1)*sp.cos(th5) + d4*sp.cos(th1), 
                -(d6*sp.sin(th5)*sp.sin(th2 + th3 + th4) - a2*sp.cos(th2) - a3*sp.cos(th2 + th3) + d5*sp.cos(th2 + th3 + th4))*sp.cos(th1), 
                -(d6*sp.sin(th5)*sp.sin(th2 + th3 + th4) - a3*sp.cos(th2 + th3) + d5*sp.cos(th2 + th3 + th4))*sp.cos(th1), 
                -(d6*sp.sin(th5)*sp.sin(th2 + th3 + th4) + d5*sp.cos(th2 + th3 + th4))*sp.cos(th1), 
                -d6*sp.sin(th1)*sp.sin(th5) + d6*sp.cos(th1)*sp.cos(th5)*sp.cos(th2 + th3 + th4), 
                0],
                [d6*sp.sin(th1)*sp.cos(th5) + d4*sp.sin(th1) + a2*sp.sin(th2)*sp.cos(th1) + d6*sp.sin(th5)*sp.cos(th1)*sp.cos(th2 + th3 + th4) + a3*sp.sin(th2 + th3)*sp.cos(th1) - d5*sp.sin(th2 + th3 + th4)*sp.cos(th1), 
                -(d6*sp.sin(th5)*sp.sin(th2 + th3 + th4) - a2*sp.cos(th2) - a3*sp.cos(th2 + th3) + d5*sp.cos(th2 + th3 + th4))*sp.sin(th1), 
                -(d6*sp.sin(th5)*sp.sin(th2 + th3 + th4) - a3*sp.cos(th2 + th3) + d5*sp.cos(th2 + th3 + th4))*sp.sin(th1), 
                -(d6*sp.sin(th5)*sp.sin(th2 + th3 + th4) + d5*sp.cos(th2 + th3 + th4))*sp.sin(th1), 
                d6*sp.sin(th1)*sp.cos(th5)*sp.cos(th2 + th3 + th4) + d6*sp.sin(th5)*sp.cos(th1), 
                0], 
                [0, 
                a2*sp.sin(th2) + d6*sp.sin(th5)*sp.cos(th2 + th3 + th4) + a3*sp.sin(th2 + th3) - d5*sp.sin(th2 + th3 + th4), 
                d6*sp.sin(th5)*sp.cos(th2 + th3 + th4) + a3*sp.sin(th2 + th3) - d5*sp.sin(th2 + th3 + th4), 
                d6*sp.sin(th5)*sp.cos(th2 + th3 + th4) - d5*sp.sin(th2 + th3 + th4), 
                d6*sp.sin(th2 + th3 + th4)*sp.cos(th5), 
                0], 
                [0, sp.sin(th1), sp.sin(th1), sp.sin(th1), -sp.sin(th2 + th3 + th4)*sp.cos(th1), sp.sin(th1)*sp.cos(th5) + sp.sin(th5)*sp.cos(th1)*sp.cos(th2 + th3 + th4)], 
                [0, -sp.cos(th1), -sp.cos(th1), -sp.cos(th1), -sp.sin(th1)*sp.sin(th2 + th3 + th4), sp.sin(th1)*sp.sin(th5)*sp.cos(th2 + th3 + th4) - sp.cos(th1)*sp.cos(th5)], 
                [1, 0, 0, 0, sp.cos(th2 + th3 + th4), sp.sin(th5)*sp.sin(th2 + th3 + th4)]])
    return J

'''
############################## Class Definitions ###############################
'''

class Cart:
    def __init__(self):
        self.wheelRadius = 0.1
        self.wheelSeperation = 0.6
        self.wMax = 4.5
        self.vicinityThresh = 0.0
        self.pathFollowingStatus = "pause"

        self.frontLeftJointHandle = sim.getObjectHandle("leftFrontJoint")
        self.frontRightJointHandle = sim.getObjectHandle("rightFrontJoint")
        self.rearRightJointHandle = sim.getObjectHandle("rightRearJoint")
        self.rearLeftJointHandle = sim.getObjectHandle("leftRearJoint")
        self.cartHandle = sim.getObjectHandle("cart")
        self.cartBaseHandle = sim.getObjectHandle("cartBase")

    def get_position(self, objectHandle=-1, withRefTo=-1):
        if objectHandle == -1:
            pos = sim.getObjectPosition(self.cartHandle, withRefTo)
        else:
            pos = sim.getObjectPosition(objectHandle, self.cartHandle)
            return np.array([round(pos[0], 3), round(pos[1], 3), round(pos[2], 3)])

    def set_wheel_speed(self, velLeft=0, velRight=0):
        velLeft  = np.clip(velLeft,  -self.wMax, self.wMax)
        velRight = np.clip(velRight, -self.wMax, self.wMax)
        sim.setJointTargetVelocity(self.frontLeftJointHandle, -velRight)
        sim.setJointTargetVelocity(self.rearLeftJointHandle, velRight)
        sim.setJointTargetVelocity(self.frontRightJointHandle, -velLeft)
        sim.setJointTargetVelocity(self.rearRightJointHandle, velLeft)

    def set_target_object(self, objectName):
        self.targetHandle = sim.getObjectHandle(objectName)

    def setPathFollowingStatus(self, status="pause"):
        # status: "pause" or "resume"
        self.pathFollowingStatus = status
        ret = sim.callScriptFunction("setPathFollowingStatus@PathFollowerDummy", sim.scripttype_childscript, 
                                                        [], 
                                                        [], 
                                                        [status], 
                                                        b'')
        return ret[0]

    def goToTable(self,tableNumber):
        print(f"Going to table{tableNumber}")
        tableHandle = sim.getObjectHandle(f"Path__ctrlPt{tableNumber+1}")
        targetPose = self.get_position(self.targetHandle)
        self.setPathFollowingStatus("resume")
        self.vicinityThresh = 0.0
        while True:
            if self.pathFollowingStatus == "resume":
                targetPose = self.get_position(self.targetHandle)
                if self._isNear(self.targetHandle, withRefTo=tableHandle, thresh=0.05):
                    self.vicinityThresh = 0.3
                    self.setPathFollowingStatus("pause")
            
            w_l, w_r = self._compute_reqd_velocity(targetPose)
            self.set_wheel_speed(w_l, w_r)
            if self._isNear(self.cartBaseHandle, withRefTo=self.targetHandle, thresh=self.vicinityThresh):
                break
        self.set_wheel_speed(0.0, 0.0)
        print(f"Reached at table{tableNumber}")
        return

    def _isNear(self, objectHandle, withRefTo=-1, thresh=0.2):
        position = sim.getObjectPosition(objectHandle, withRefTo)
        # print("position: ", position)
        # print("error: ", np.linalg.norm(np.array(position)))
        if np.linalg.norm(np.array(position)) < thresh:
            return True
        return False

    def _compute_reqd_velocity(self, targetPose):
        distance = np.linalg.norm(targetPose)
        phi = np.arctan2(targetPose[1], targetPose[0])
        # Proportional control
        v_des = 1 * np.clip(distance, -0.5, 0.5)
        w_des = 3 * phi
        v_r = v_des - (self.wheelSeperation/2)*w_des
        v_l = v_des + (self.wheelSeperation/2)*w_des
        # calc wheel speed
        w_r = v_r/self.wheelRadius
        w_l = v_l/self.wheelRadius
        return w_r, w_l


class Manipulator:
    def __init__(self, goToInitPos=True):
        self.gripper = Gripper()
        self.targetPose = np.array([0.0]*6)

        # Joint angles in radian
        self.actualJointAngles = np.array([0.0]*6)
        self.targetJointAngles = np.array([0.0, 0.0, np.pi/2, 0.0, -np.pi/2, 0.0])
        self.initialConfig = np.array([0.0, 0.0, np.pi/2, 0.0, -np.pi/2, 0.0])

        self.endEffectorHandle = sim.getObjectHandle("UR5_tip")
        self.armBaseHandle = sim.getObjectHandle("UR5")

        if goToInitPos:
            # Set initial configuration
            self.moveToConfig(config=self.initialConfig, kinematics="FK")

        self.jointHandles = [-1]*6
        for i in range(6):
            self.jointHandles[i] = sim.getObjectHandle(f"UR5_joint{i+1}")
        
    def getPose(self, ObjectName="", withRefTo=-1):
        if ObjectName == "":
            # return endEffector pose wrt base
            position = sim.getObjectPosition(self.endEffectorHandle, withRefTo)
            orientation = sim.getObjectQuaternion(self.endEffectorHandle, withRefTo)
        else:
            goalHandle = sim.getObjectHandle(ObjectName)
            position = sim.getObjectPosition(goalHandle, withRefTo)
            orientation = sim.getObjectQuaternion(goalHandle, withRefTo)
        goalPose = [position[0], position[1], position[2], orientation[0], orientation[1], orientation[2], orientation[3]]
        return goalPose

    def placeObject(self, objectName, toLocationName):
        goalPose = self.getPose(objectName)
        self.moveToConfig(config=goalPose, kinematics="IK")
        self.gripper.pick(objectName)
        goalPose = self.getPose(toLocationName)
        self.moveToConfig(config=goalPose, kinematics="IK")
        self.gripper.placeOn(toLocationName)
        self.moveToConfig(config=self.initialConfig, kinematics="FK")
        return

    def pickObject(self, objectName, placeOnCart):
        goalPose = self.getPose(objectName)
        self.moveToConfig(config=goalPose, kinematics="IK")
        self.gripper.pick(objectName)
        goalPose = self.getPose(placeOnCart)
        self.moveToConfig(config=goalPose, kinematics="IK")
        self.gripper.placeOn("cart")
        self.moveToConfig(config=self.initialConfig, kinematics="FK")
        return

    def moveToPose(self, targetPose):
        self.targetPose = targetPose
        dP = sp.Matrix([[0.], [0.], [0.], [0.], [0.], [0.]])
        J = getJacobianUR5()
        for i in range(6):
            self.actualJointAngles[i] = sim.getJointPosition(self.jointHandles[i])
        
        while True:
            if self._isTargetPositionReached(self.armBaseHandle):
                break
            P_tip = self.getPose("", withRefTo=self.armBaseHandle)  # pose of end effector wrt base
            
            dP[0] = np.clip(targetPose[0] - P_tip[0], -0.1, 0.1)
            dP[1] = np.clip(targetPose[1] - P_tip[1], -0.1, 0.1)
            dP[2] = np.clip(targetPose[2] - P_tip[2], -0.1, 0.1)
            dP[3] = 0.0
            dP[4] = 0.0
            dP[5] = 0.0
            
            Js = J.subs([(th1, self.actualJointAngles[0]), (th2, self.actualJointAngles[1]), (th3, self.actualJointAngles[2]), 
                         (th4, self.actualJointAngles[3]), (th5, self.actualJointAngles[4]), (th6, self.actualJointAngles[5])])
            J_inv = Js.inv('LU')
            dTh = np.array(J_inv @ dP).reshape(1,6)
            dTh = np.clip(dTh, -0.05, 0.05)
            jointConfig = self.actualJointAngles + dTh
            self.moveToJointConfig(jointConfig[0])
        return
       
    def _isTargetPositionReached(self, withRefTo=-1):
        endEffectorPosition = sim.getObjectPosition(self.endEffectorHandle, withRefTo)
        endEffectorPosition = np.array(endEffectorPosition)
        # print("===========================")
        # print("targetPose: ", self.targetPose[:3])
        # print("P_tip:      ", endEffectorPosition[:3])
        # print("error: ",np.linalg.norm(self.targetPose[:3] - endEffectorPosition))
        # print("===========================")
        if np.linalg.norm(self.targetPose[:3] - endEffectorPosition) < 0.02:
            return True
        return False
        
    def moveToJointConfig(self, jointConfig):
        for i in range(6):
            sim.setJointTargetPosition(self.jointHandles[i], jointConfig[i])
        while not self._isJointTargetPositionReached(jointConfig):
            pass
        return

    def _isJointTargetPositionReached(self, jointConfig):
        for i in range(6):
            self.actualJointAngles[i] = sim.getJointPosition(self.jointHandles[i])
        # print("===========================")
        # print("actualAngles: ", self.actualJointAngles)
        # print("JointConfig:      ", jointConfig)
        # print("error: ", jointConfig - self.actualJointAngles)
        # print("===========================")
        if max(jointConfig - self.actualJointAngles) < 0.01:
            return True
        return False

    def moveToConfig(self, config, kinematics="IK"):
        if kinematics not in ["IK", "FK"]:
            print("Wrong kinematic type given")
            return False
        elif kinematics == "IK":
            config[2] += 0.15  # gripper should be 15 cm above the object
            config[3] = 180 # gripper should be upside down
            config[4] = 180
        ret = sim.callScriptFunction("startMovingArm@UR5", sim.scripttype_childscript, 
                                                        [], 
                                                        config.tolist(), 
                                                        [kinematics], 
                                                        b'')
        print("Going to Checkpoint")
        time.sleep(2)
        while not self._isArmReached():
            time.sleep(1)
        print(f"Reached.")
        return

    def _isArmReached(self):
        ret = sim.callScriptFunction("isArmReached@UR5", sim.scripttype_childscript, 
                                                        [], 
                                                        [], 
                                                        [], 
                                                        b'')
        return ret[1][0] == 1


class Gripper:
    def __init__(self):
        self.grip_top = sim.getObjectHandle('ROBOTIQ_85_active1')
        self.grip_bottom = sim.getObjectHandle('ROBOTIQ_85_active2')
        self.gripT_pos = sim.getJointPosition(self.grip_top)
        self.gripB_pos = sim.getJointPosition(self.grip_bottom)
        self.connector=sim.getObjectHandle('ROBOTIQ_85')

        self.grippedObject = None
        
    def openCloseGripper(self, activity="close"):
        if activity == "close":
            activity = "closeClicked"
            print("Gripper closed")
        else:
            activity = "openClicked"
            print("Gripper opened")
        ret = sim.callScriptFunction(f"{activity}@ROBOTIQ_85", sim.scripttype_childscript,
                                                    [],[], 
                                                    [], 
                                                    b'')
        return

    def gripObject(self):
        sim.setJointTargetVelocity(self.grip_top, 0)
        sim.setJointTargetVelocity(self.grip_bottom, 0)

    def pick(self, objectName):
        #self.openCloseGripper("close")
        time.sleep(2)
        self.gripObject()
        objectHandle = sim.getObjectHandle(objectName)
        sim.setObjectParent(objectHandle, self.connector, True)
        self.grippedObject = objectHandle
        return

    def placeOn(self, parentName=""):
        self.openCloseGripper("open")
        if self.grippedObject == None:
            print("No object in gripper")
        parentHandle = sim.getObjectHandle(parentName)
        sim.setObjectParent(self.grippedObject, parentHandle, True)
        return
        
'''
################################## Main logic ##################################
'''
    
def main():
    try:
        sim.startSimulation()
        time.sleep(1) # necessary for simulation to start properly

        # # Manipulator demo
        # # Using custom functions for solving IK
        # arm = Manipulator(goToInitPos=False)
        # arm.moveToJointConfig(arm.targetJointAngles)
        # for waypoint in [4,1,2,3]:
        #     goalPose = arm.getPose(f"waypoint{waypoint}", withRefTo=arm.armBaseHandle)
        #     arm.moveToPose(targetPose=goalPose)
        #     print("Location reached")
        # arm.moveToJointConfig(arm.targetJointAngles)
        
        # Complete demo
        cart = Cart()
        arm = Manipulator()

        cart.set_target_object("PathFollowerDummy")

        # Order 1 Placing
        cart.goToTable(0)
        arm.placeObject("Cup0", "Table1PlaceLocation")

        # Order 2 Picking
        cart.goToTable(1)
        arm.pickObject("Cup4", "CartPlaceLocation1")

        # Order 3 Placing
        cart.goToTable(2)
        arm.placeObject("Cup1", "Table3PlaceLocation")
        
        # Order 4 Placing
        cart.goToTable(4)
        arm.placeObject("Cup2", "Table5PlaceLocation")
        
        # Order 5 Picking
        cart.goToTable(5)
        arm.pickObject("Cup3", "CartPlaceLocation2")

        # print("---- All orders fulfilled ----")
        
    except Exception as e:
        print(e)
    finally:
        sim.pauseSimulation()


if __name__ == "__main__":
    main()