package com.heerkirov.hedge.server.dto

import com.heerkirov.hedge.server.exceptions.ConflictingGroupMembersError

data class MetaTagValidateRes(val notSuitable: List<TagSimpleRes>,
                              val conflictingMembers: List<ConflictingGroupMembersError.ConflictingMembers>,
                              val forceConflictingMembers: List<ConflictingGroupMembersError.ConflictingMembers>)