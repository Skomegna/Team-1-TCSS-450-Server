DROP TABLE IF EXISTS Members;
CREATE TABLE Members (MemberID SERIAL PRIMARY KEY,
                      FirstName VARCHAR(255) NOT NULL,
		              LastName VARCHAR(255) NOT NULL,
                      Nickname VARCHAR(255) NOT NULL UNIQUE,
                      Email VARCHAR(255) NOT NULL UNIQUE,
                      Password VARCHAR(255) NOT NULL,
                      SALT VARCHAR(255),
                      Verification INT DEFAULT 0
);

DROP TABLE IF EXISTS VerificationCode;
CREATE TABLE VerificationCode (Email VARCHAR(255) NOT NULL,
                    Code INT NOT NULL,
                    FOREIGN KEY(Email) REFERENCES Members(Email)
);

DROP TABLE IF EXISTS Contacts;
CREATE TABLE Contacts(PrimaryKey SERIAL PRIMARY KEY,
                      MemberID_A INT NOT NULL,
                      MemberID_B INT NOT NULL,
                      FOREIGN KEY(MemberID_A) REFERENCES Members(MemberID),
                      FOREIGN KEY(MemberID_B) REFERENCES Members(MemberID)
);

DROP TABLE IF EXISTS Contact_Requests;
CREATE TABLE Contact_Requests(PrimaryKey SERIAL PRIMARY KEY,
                      MemberID_A INT NOT NULL,
                      MemberID_B INT NOT NULL
);


DROP TABLE IF EXISTS Chats;
CREATE TABLE Chats (ChatID SERIAL PRIMARY KEY,
                    Name VARCHAR(255)
);

DROP TABLE IF EXISTS ChatMembers;
CREATE TABLE ChatMembers (ChatID INT NOT NULL,
                          MemberID INT NOT NULL,
                          FOREIGN KEY(MemberID) REFERENCES Members(MemberID),
                          FOREIGN KEY(ChatID) REFERENCES Chats(ChatID)
);


DROP TABLE IF EXISTS Messages;
CREATE TABLE Messages (PrimaryKey SERIAL PRIMARY KEY,
                       ChatID INT,
                       Message VARCHAR(255),
                       MemberID INT,
                       FOREIGN KEY(MemberID) REFERENCES Members(MemberID),
                       FOREIGN KEY(ChatID) REFERENCES Chats(ChatID),
                       TimeStamp TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

DROP TABLE IF EXISTS Locations;
CREATE TABLE Locations (PrimaryKey SERIAL PRIMARY KEY,
                        MemberID INT,
                        Nickname VARCHAR(255),
                        Lat DECIMAL,
                        Long DECIMAL,
                        ZIP INT,
                        FOREIGN KEY(MemberID) REFERENCES Members(MemberID)
);

DROP TABLE IF EXISTS Push_Token;
CREATE TABLE Push_Token (KeyID SERIAL PRIMARY KEY,
                        MemberID INT NOT NULL UNIQUE,
                        Token VARCHAR(255),
                        FOREIGN KEY(MemberID) REFERENCES Members(MemberID)
);

SELECT chat.name, message.ChatID, message.Message, message.TimeStamp
FROM Chats chat, Messages message
WHERE message.ChatID=chat.message AND chat.ChatID='$1'


select mes.message, mes.chatid, mes.timeStamp 
from messages mes, chats ch where =(select cm.chatid from chatmembers where cm.memberid=);


SELECT transaction_id, checkings_id, amount, category_id
FROM Transactions t1
WHERE amount > (
  SELECT AVG(t2.amount)
  FROM Transactions t2
  WHERE t2.category_id=t1.category_id
    AND t2.savings_id IS NULL
    AND t1.savings_id IS NULL)
ORDER BY category_id ASC;

Select distinct message, MAX(messageID) OVER (PARTITION BY chat.chatid) AS MessageID FROM messages, 